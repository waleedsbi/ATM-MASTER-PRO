import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه عرض جداول قاعدة البيانات
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
    } catch (connectionError) {
      console.error('Database connection error:', connectionError);
      return NextResponse.json(
        { 
          error: 'فشل الاتصال بقاعدة البيانات', 
          details: connectionError instanceof Error ? connectionError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }
    
    // Get all table names from the database
    let result: any[];
    try {
      result = await prisma.$queryRaw<any[]>`
        SELECT 
          TABLE_NAME as name,
          (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as columnCount
        FROM INFORMATION_SCHEMA.TABLES t
        WHERE TABLE_SCHEMA = 'dbo' 
          AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;
    } catch (queryError) {
      console.error('Error fetching table list:', queryError);
      return NextResponse.json(
        { 
          error: 'فشل جلب قائمة الجداول', 
          details: queryError instanceof Error ? queryError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    if (!result || result.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get row counts for each table with better error handling
    const tablesWithCounts = await Promise.all(
      result.map(async (table) => {
        const tableName = table.name;
        if (!tableName || typeof tableName !== 'string') {
          return {
            name: tableName || 'Unknown',
            rowCount: 0,
            columns: [],
          };
        }

        try {
          // Validate table name to prevent SQL injection
          // SQL Server allows table names with letters, numbers, underscores, and some special chars
          // But we'll be conservative and only allow safe characters
          if (!tableName || tableName.length === 0 || tableName.length > 128) {
            console.warn(`Invalid table name length: ${tableName}`);
            return {
              name: tableName,
              rowCount: 0,
              columns: [],
            };
          }
          
          // Check for dangerous characters that could be used for SQL injection
          if (/[;'\"\\]/.test(tableName)) {
            console.warn(`Potentially dangerous table name: ${tableName}`);
            return {
              name: tableName,
              rowCount: 0,
              columns: [],
            };
          }

          // Get row count - try multiple methods for reliability
          let countResult: any[];
          try {
            // Method 1: Direct COUNT (most accurate but slower for large tables)
            countResult = await prisma.$queryRawUnsafe<any[]>(
              `SELECT COUNT(*) as count FROM [dbo].[${tableName.replace(/[\[\]]/g, '')}]`
            );
          } catch (countError) {
            // Fallback: Use sys.partitions (faster but approximate)
            try {
              countResult = await prisma.$queryRawUnsafe<any[]>(
                `SELECT SUM(p.rows) as count 
                 FROM sys.tables t
                 INNER JOIN sys.partitions p ON t.object_id = p.object_id
                 WHERE t.name = '${tableName.replace(/'/g, "''")}' 
                   AND t.schema_id = SCHEMA_ID('dbo')
                   AND p.index_id IN (0,1)`
              );
            } catch (fallbackError) {
              console.error(`Error getting count for ${tableName}:`, fallbackError);
              countResult = [{ count: 0 }];
            }
          }
          
          // Get columns using INFORMATION_SCHEMA (safer)
          const columnsResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'dbo' 
               AND TABLE_NAME = '${tableName.replace(/'/g, "''")}'
             ORDER BY ORDINAL_POSITION`
          );
          
          return {
            name: tableName,
            rowCount: Number(countResult?.[0]?.count || 0),
            columns: Array.isArray(columnsResult) 
              ? columnsResult.map((c: any) => c.COLUMN_NAME).filter((name: string) => name)
              : [],
          };
        } catch (error) {
          console.error(`Error getting data for table ${tableName}:`, error);
          // Return table info even if we can't get details
          return {
            name: tableName,
            rowCount: 0,
            columns: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );
    
    return NextResponse.json(tablesWithCounts);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { 
        error: 'فشل جلب الجداول', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

