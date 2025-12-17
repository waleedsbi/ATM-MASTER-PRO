import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

// Helper function to serialize complex data types
function serializeValue(value: any): any {
  if (value === null || value === undefined) return value;
  
  // Handle BigInt
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  // Handle Date
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle Buffer (for binary data)
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }
  
  // Handle objects recursively
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(serializeValue);
    }
    const serialized: any = {};
    for (const key in value) {
      serialized[key] = serializeValue(value[key]);
    }
    return serialized;
  }
  
  return value;
}

export async function POST(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه عمل نسخة احتياطية
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();

    console.log('Starting backup process...');

    // Get all tables (limit to avoid timeouts)
    const tablesResult = await prisma.$queryRaw<any[]>`
      SELECT TABLE_NAME as name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    console.log(`Found ${tablesResult.length} tables to backup`);

    const backup: any = {
      timestamp: new Date().toISOString(),
      database: 'ATM_Master_Pro',
      tables: {},
      summary: {
        totalTables: tablesResult.length,
        successfulTables: 0,
        failedTables: 0,
      },
    };

    // Export data from each table
    for (const table of tablesResult) {
      const tableName = table.name;
      console.log(`Backing up table: ${tableName}`);
      
      try {
        // Get row count first
        const countResult = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as count FROM [dbo].[${tableName}]`
        );
        const rowCount = Number(countResult[0]?.count || 0);

        // Skip empty tables or limit large tables
        let data: any = [];
        if (rowCount > 0 && rowCount <= 10000) {
          // Only backup tables with reasonable size
          data = await prisma.$queryRawUnsafe(
            `SELECT TOP 10000 * FROM [dbo].[${tableName}]`
          );
          
          // Serialize data to handle complex types
          data = serializeValue(data);
        }

        // Get table schema
        const schema = await prisma.$queryRaw<any[]>`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = ${tableName}
          ORDER BY ORDINAL_POSITION
        `;

        backup.tables[tableName] = {
          schema: serializeValue(schema),
          data,
          rowCount,
          backedUpRows: Array.isArray(data) ? data.length : 0,
        };
        
        backup.summary.successfulTables++;
        console.log(`Successfully backed up ${tableName}: ${rowCount} rows`);
      } catch (tableError) {
        console.error(`Error backing up table ${tableName}:`, tableError);
        backup.tables[tableName] = {
          error: tableError instanceof Error ? tableError.message : 'Unknown error',
        };
        backup.summary.failedTables++;
      }
    }

    console.log('Backup completed, creating audit log...');

    // Create audit log
    await createAuditLog({
      action: 'BACKUP',
      details: `نسخة احتياطية لـ ${backup.summary.successfulTables}/${tablesResult.length} جدول`,
      success: backup.summary.failedTables === 0,
    }, request);

    console.log('Converting to JSON...');

    // Convert to JSON with custom replacer for BigInt
    const jsonData = JSON.stringify(backup, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);

    // Return as downloadable file
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    try {
      await createAuditLog({
        action: 'BACKUP',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }, request);
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(
      { 
        error: 'فشل إنشاء النسخة الاحتياطية', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

