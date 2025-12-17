import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه استيراد البيانات
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tableName = formData.get('table') as string;
    const mode = formData.get('mode') as string; // 'append' or 'replace'

    if (!file) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }

    if (!tableName) {
      return NextResponse.json({ error: 'اسم الجدول مطلوب' }, { status: 400 });
    }

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json({ error: 'اسم جدول غير صالح' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    let data: any[];

    try {
      // Try parsing as JSON
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parser
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          throw new Error('ملف CSV فارغ');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام JSON أو CSV');
      }
    } catch (parseError) {
      await createAuditLog({
        action: 'IMPORT',
        tableName,
        success: false,
        errorMessage: parseError instanceof Error ? parseError.message : 'خطأ في قراءة الملف',
      }, request);

      return NextResponse.json({
        error: 'فشل قراءة الملف',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
      }, { status: 400 });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'البيانات فارغة أو غير صالحة' }, { status: 400 });
    }

    const prisma = getPrisma();

    try {
      // If mode is 'replace', truncate table first
      if (mode === 'replace') {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE [dbo].[${tableName}]`);
      }

      // Get column info
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

      // Insert data
      let insertedCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Build INSERT query
          const columnNames = Object.keys(row).filter(key => 
            columns.some(c => c.name === key)
          );

          if (columnNames.length === 0) {
            errors.push(`لا توجد أعمدة متطابقة للصف: ${JSON.stringify(row)}`);
            continue;
          }

          const values = columnNames.map(col => {
            const value = row[col];
            if (value === null || value === undefined || value === '') return 'NULL';
            if (typeof value === 'number') return value.toString();
            // Escape single quotes
            return `'${String(value).replace(/'/g, "''")}'`;
          });

          const query = `
            INSERT INTO [dbo].[${tableName}] (${columnNames.map(c => `[${c}]`).join(', ')})
            VALUES (${values.join(', ')})
          `;

          await prisma.$executeRawUnsafe(query);
          insertedCount++;
        } catch (rowError) {
          errors.push(
            `خطأ في الصف ${insertedCount + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
          );
        }
      }

      await createAuditLog({
        action: 'IMPORT',
        tableName,
        details: `استيراد ${insertedCount} صف، ${errors.length} خطأ، الوضع: ${mode}`,
        success: errors.length === 0,
        errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      }, request);

      return NextResponse.json({
        success: true,
        insertedCount,
        totalRows: data.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (dbError) {
      await createAuditLog({
        action: 'IMPORT',
        tableName,
        success: false,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown database error',
      }, request);

      throw dbError;
    }
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'فشل استيراد البيانات', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

