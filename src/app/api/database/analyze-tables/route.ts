import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

// List of tables that are actively used in the application
const USED_TABLES = [
  // Core System Tables
  'User',
  'AuditLog',
  
  // ATM Management
  'BankATM',
  'ATM',
  
  // Work Plans
  'WorkPlanHeaders',
  'WorkPlan',
  
  // Representatives
  'DelegateData',
  'Representative',
  
  // Geography
  'GovernorateCode',
  'CityCode',
  
  // Bank Data
  'BankCode',
  'BankContractData',
  
  // Comments and Reviews
  'ClientComment',
  
  // System Tables
  'AspNetUsers',
  'AspNetRoles',
  'AspNetUserRoles',
  'AspNetUserClaims',
  'AspNetUserLogins',
  'AspNetUserTokens',
  'AspNetRoleClaims',
  '__EFMigrationsHistory',
];

// Tables that should NEVER be deleted (protected)
const PROTECTED_TABLES = [
  'User',
  'AuditLog',
  'AspNetUsers',
  'AspNetRoles',
  '__EFMigrationsHistory',
];

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه تحليل الجداول
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    
    // Get all tables in the database
    const allTablesResult = await prisma.$queryRaw<any[]>`
      SELECT 
        t.TABLE_NAME as name,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as columnCount
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_SCHEMA = 'dbo' AND t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME
    `;

    const analysis = {
      totalTables: allTablesResult.length,
      usedTables: [] as any[],
      unusedTables: [] as any[],
      protectedTables: [] as any[],
      statistics: {
        usedCount: 0,
        unusedCount: 0,
        protectedCount: 0,
        totalRows: 0,
        unusedRows: 0,
      }
    };

    // Analyze each table
    for (const table of allTablesResult) {
      const tableName = table.name;
      
      try {
        // Get row count
        const countResult = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as count FROM [dbo].[${tableName}]`
        );
        const rowCount = Number(countResult[0]?.count || 0);

        // Get table size (approximate)
        const sizeResult = await prisma.$queryRaw<any[]>`
          SELECT 
            SUM(a.total_pages) * 8 AS size_kb
          FROM sys.tables t
          INNER JOIN sys.indexes i ON t.object_id = i.object_id
          INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
          INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
          WHERE t.name = ${tableName}
          GROUP BY t.name
        `;
        const sizeKb = Number(sizeResult[0]?.size_kb || 0);

        const tableInfo = {
          name: tableName,
          rowCount,
          columnCount: table.columnCount,
          sizeKb,
          sizeMb: (sizeKb / 1024).toFixed(2),
          isUsed: USED_TABLES.includes(tableName),
          isProtected: PROTECTED_TABLES.includes(tableName),
        };

        analysis.statistics.totalRows += rowCount;

        if (PROTECTED_TABLES.includes(tableName)) {
          analysis.protectedTables.push(tableInfo);
          analysis.statistics.protectedCount++;
        } else if (USED_TABLES.includes(tableName)) {
          analysis.usedTables.push(tableInfo);
          analysis.statistics.usedCount++;
        } else {
          analysis.unusedTables.push(tableInfo);
          analysis.statistics.unusedCount++;
          analysis.statistics.unusedRows += rowCount;
        }
      } catch (error) {
        console.error(`Error analyzing table ${tableName}:`, error);
      }
    }

    // Sort by size (largest first)
    analysis.unusedTables.sort((a, b) => b.sizeKb - a.sizeKb);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing tables:', error);
    return NextResponse.json(
      { error: 'فشل تحليل الجداول', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

