import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه استعادة النسخة الاحتياطية
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  console.log('=== RESTORE BACKUP: START ===');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string; // 'merge', 'replace', or 'upsert'
    const selectedTables = formData.get('tables') as string; // JSON array of table names

    console.log('Restore parameters:', { 
      hasFile: !!file, 
      fileName: file?.name,
      fileSize: file?.size,
      mode, 
      selectedTables 
    });

    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'ملف النسخة الاحتياطية مطلوب' }, { status: 400 });
    }

    // Read and parse backup file
    console.log('Reading file content...');
    const text = await file.text();
    console.log(`File content length: ${text.length} characters`);
    
    let backup: any;

    try {
      backup = JSON.parse(text);
      console.log('Backup file parsed successfully');
      console.log('Backup metadata:', {
        timestamp: backup.timestamp,
        database: backup.database,
        hasTablesKey: 'tables' in backup,
        tablesType: typeof backup.tables,
        tableCount: backup.tables ? Object.keys(backup.tables).length : 0
      });
    } catch (parseError) {
      console.error('Failed to parse backup file:', parseError);
      return NextResponse.json({
        error: 'فشل قراءة ملف النسخة الاحتياطية',
        details: parseError instanceof Error ? parseError.message : 'الملف غير صالح أو تالف',
      }, { status: 400 });
    }

    // Validate backup structure
    if (!backup.tables || typeof backup.tables !== 'object') {
      console.error('Invalid backup structure:', { 
        hasTables: 'tables' in backup,
        tablesType: typeof backup.tables 
      });
      return NextResponse.json({
        error: 'صيغة النسخة الاحتياطية غير صالحة',
        details: 'الملف لا يحتوي على جداول',
      }, { status: 400 });
    }

    const prisma = getPrisma();
    let tablesToRestore: string[];

    // Determine which tables to restore
    if (selectedTables) {
      try {
        tablesToRestore = JSON.parse(selectedTables);
      } catch {
        tablesToRestore = Object.keys(backup.tables);
      }
    } else {
      tablesToRestore = Object.keys(backup.tables);
    }

    console.log(`Restoring ${tablesToRestore.length} tables...`);

    const results: any = {
      totalTables: tablesToRestore.length,
      successfulTables: 0,
      failedTables: 0,
      insertedRows: 0,
      errors: [],
    };

    // Restore each table
    for (const tableName of tablesToRestore) {
      const tableBackup = backup.tables[tableName];
      
      if (!tableBackup || !tableBackup.data || tableBackup.error) {
        console.log(`Skipping ${tableName}: no valid data`);
        results.errors.push(`${tableName}: لا توجد بيانات صالحة`);
        results.failedTables++;
        continue;
      }

      try {
        console.log(`Restoring table: ${tableName}`);
        
        // Check if table exists
        const tableExists = await prisma.$queryRaw<any[]>`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = ${tableName} AND TABLE_SCHEMA = 'dbo'
        `;

        if (tableExists.length === 0) {
          console.log(`Table ${tableName} does not exist, skipping...`);
          results.errors.push(`${tableName}: الجدول غير موجود في قاعدة البيانات`);
          results.failedTables++;
          continue;
        }

        const data = tableBackup.data;
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log(`Table ${tableName} has no data, skipping...`);
          results.successfulTables++;
          continue;
        }

        // If mode is 'replace', clear table first
        if (mode === 'replace') {
          try {
            // Disable foreign key constraints temporarily
            await prisma.$executeRawUnsafe(`ALTER TABLE [dbo].[${tableName}] NOCHECK CONSTRAINT ALL`);
            
            // Try TRUNCATE first
            try {
              await prisma.$executeRawUnsafe(`TRUNCATE TABLE [dbo].[${tableName}]`);
              console.log(`Truncated table ${tableName}`);
            } catch (truncateError) {
              // If TRUNCATE fails, use DELETE
              await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[${tableName}]`);
              console.log(`Deleted all rows from ${tableName}`);
            }
            
            // Re-enable foreign key constraints
            await prisma.$executeRawUnsafe(`ALTER TABLE [dbo].[${tableName}] WITH CHECK CHECK CONSTRAINT ALL`);
          } catch (clearError) {
            console.error(`Failed to clear table ${tableName}:`, clearError);
            results.errors.push(`${tableName}: فشل تفريغ الجدول - ${clearError instanceof Error ? clearError.message : 'Unknown'}`);
            results.failedTables++;
            continue;
          }
        }

        // Get table columns
        const columnsResult = await prisma.$queryRaw<any[]>`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = ${tableName}
          ORDER BY ORDINAL_POSITION
        `;

        const columns = columnsResult.map(c => ({
          name: c.COLUMN_NAME,
          type: c.DATA_TYPE,
          nullable: c.IS_NULLABLE === 'YES',
        }));

        // Get primary key column(s)
        const pkResult = await prisma.$queryRaw<any[]>`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_NAME = ${tableName}
            AND CONSTRAINT_NAME LIKE 'PK_%'
        `;
        const primaryKeys = pkResult.map(pk => pk.COLUMN_NAME);
        console.log(`${tableName} primary keys:`, primaryKeys);

        // Check if table has identity column
        const identityCheck = await prisma.$queryRaw<any[]>`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = ${tableName}
            AND COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1
        `;
        const hasIdentity = identityCheck.length > 0;
        const identityColumn = hasIdentity ? identityCheck[0].COLUMN_NAME : null;

        // Insert data using MERGE for better handling of duplicates
        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          try {
            // Filter only valid columns that exist in the target table
            const validColumns = Object.keys(row).filter(key => 
              columns.some(c => c.name === key)
            );

            if (validColumns.length === 0) {
              skippedCount++;
              continue;
            }

            // Build value formatters
            const formatValue = (col: string) => {
              const value = row[col];
              if (value === null || value === undefined || value === '') return 'NULL';
              if (typeof value === 'number') return value.toString();
              if (typeof value === 'boolean') return value ? '1' : '0';
              const stringValue = String(value);
              return `'${stringValue.replace(/'/g, "''")}'`;
            };

            const columnNames = validColumns.map(c => `[${c}]`).join(', ');
            const values = validColumns.map(formatValue);

            let query: string;

            // Handle different modes
            if (mode === 'upsert' && primaryKeys.length > 0) {
              // Use MERGE statement for upsert
              const pkConditions = primaryKeys
                .filter(pk => validColumns.includes(pk))
                .map(pk => `target.[${pk}] = source.[${pk}]`)
                .join(' AND ');

              if (!pkConditions) {
                // No primary keys available, fall back to insert
                query = `INSERT INTO [dbo].[${tableName}] (${columnNames}) VALUES (${values.join(', ')})`;
              } else {
                const updateSet = validColumns
                  .filter(c => !primaryKeys.includes(c)) // Don't update PK columns
                  .map(c => `target.[${c}] = source.[${c}]`)
                  .join(', ');

                const sourceColumns = validColumns.map((c, idx) => `${values[idx]} AS [${c}]`).join(', ');

                if (hasIdentity && validColumns.includes(identityColumn)) {
                  query = `
                    SET IDENTITY_INSERT [dbo].[${tableName}] ON;
                    MERGE [dbo].[${tableName}] AS target
                    USING (SELECT ${sourceColumns}) AS source
                    ON ${pkConditions}
                    WHEN MATCHED THEN UPDATE SET ${updateSet || 'target.[' + validColumns[0] + '] = source.[' + validColumns[0] + ']'}
                    WHEN NOT MATCHED THEN INSERT (${columnNames}) VALUES (${validColumns.map(c => `source.[${c}]`).join(', ')});
                    SET IDENTITY_INSERT [dbo].[${tableName}] OFF;
                  `;
                } else {
                  query = `
                    MERGE [dbo].[${tableName}] AS target
                    USING (SELECT ${sourceColumns}) AS source
                    ON ${pkConditions}
                    WHEN MATCHED THEN UPDATE SET ${updateSet || 'target.[' + validColumns[0] + '] = source.[' + validColumns[0] + ']'}
                    WHEN NOT MATCHED THEN INSERT (${columnNames}) VALUES (${validColumns.map(c => `source.[${c}]`).join(', ')});
                  `;
                }
              }
            } else if (mode === 'merge' && primaryKeys.length > 0) {
              // Check if exists, skip if found
              const pkConditions = primaryKeys
                .filter(pk => row[pk] !== null && row[pk] !== undefined)
                .map(pk => {
                  const value = row[pk];
                  if (typeof value === 'number') return `[${pk}] = ${value}`;
                  return `[${pk}] = '${String(value).replace(/'/g, "''")}'`;
                })
                .join(' AND ');

              if (pkConditions) {
                const existsResult = await prisma.$queryRawUnsafe<any[]>(
                  `SELECT 1 FROM [dbo].[${tableName}] WHERE ${pkConditions}`
                );
                
                if (existsResult.length > 0) {
                  skippedCount++;
                  continue;
                }
              }

              // Insert new record
              if (hasIdentity && validColumns.includes(identityColumn)) {
                query = `
                  SET IDENTITY_INSERT [dbo].[${tableName}] ON;
                  INSERT INTO [dbo].[${tableName}] (${columnNames}) VALUES (${values.join(', ')});
                  SET IDENTITY_INSERT [dbo].[${tableName}] OFF;
                `;
              } else {
                query = `INSERT INTO [dbo].[${tableName}] (${columnNames}) VALUES (${values.join(', ')})`;
              }
            } else {
              // Simple insert (for replace mode or no PK)
              if (hasIdentity && validColumns.includes(identityColumn)) {
                query = `
                  SET IDENTITY_INSERT [dbo].[${tableName}] ON;
                  INSERT INTO [dbo].[${tableName}] (${columnNames}) VALUES (${values.join(', ')});
                  SET IDENTITY_INSERT [dbo].[${tableName}] OFF;
                `;
              } else {
                query = `INSERT INTO [dbo].[${tableName}] (${columnNames}) VALUES (${values.join(', ')})`;
              }
            }

            await prisma.$executeRawUnsafe(query);
            insertedCount++;
            
            // Log progress every 100 rows
            if (insertedCount % 100 === 0) {
              console.log(`${tableName}: Inserted ${insertedCount}/${data.length} rows (skipped: ${skippedCount})`);
            }
          } catch (rowError) {
            errorCount++;
            if (errorCount <= 3) {
              console.error(`Failed to insert row ${i} in ${tableName}:`, {
                error: rowError instanceof Error ? rowError.message.substring(0, 200) : 'Unknown',
              });
            }
          }
        }

        console.log(`Successfully restored ${insertedCount} rows to ${tableName} (skipped: ${skippedCount}, errors: ${errorCount})`);
        results.insertedRows += insertedCount;
        
        if (insertedCount > 0 || (skippedCount > 0 && errorCount === 0)) {
          results.successfulTables++;
        } else {
          results.failedTables++;
          results.errors.push(`${tableName}: تم إدراج ${insertedCount} صف فقط من ${data.length} (أخطاء: ${errorCount})`);
        }

      } catch (tableError) {
        console.error(`Error restoring table ${tableName}:`, tableError);
        results.errors.push(
          `${tableName}: ${tableError instanceof Error ? tableError.message : 'خطأ غير معروف'}`
        );
        results.failedTables++;
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'IMPORT',
      details: `استعادة ${results.successfulTables}/${results.totalTables} جدول، ${results.insertedRows} صف، الوضع: ${mode}`,
      success: results.failedTables === 0,
      errorMessage: results.errors.length > 0 ? results.errors.join('; ') : undefined,
    }, request);

    console.log('Restore completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
      message: `تمت استعادة ${results.successfulTables} جدول بنجاح (${results.insertedRows} صف)`,
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    try {
      await createAuditLog({
        action: 'IMPORT',
        details: 'فشل استعادة النسخة الاحتياطية',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }, request);
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(
      {
        error: 'فشل استعادة النسخة الاحتياطية',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

