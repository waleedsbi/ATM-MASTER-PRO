import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { withTimeout } from '@/lib/query-timeout';

// Cache for 30 seconds - البيانات لا تتغير كثيراً
export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET() {
  try {
    const prisma = getPrisma();
    
    // Use optimized raw SQL queries for better performance on large tables
    // This is faster than Prisma ORM for COUNT operations on large tables
    // Add timeout to prevent long-running queries
    const [
      atmsCountResult,
      workPlansCountResult,
      usersCountResult,
      banksCountResult,
      representativesCountResult,
      totalCommentsResult,
      unreadCommentsResult,
      workPlanStatusCountsResult,
      atmsByBankRaw
    ] = await Promise.all([
      // Use raw SQL for COUNT - check both BankATM and ATM tables
      withTimeout(
        (async () => {
          // Try BankATM first
          if (prisma.bankATM) {
            const bankATMCount = await prisma.bankATM.count({
              where: {
                IsDeleted: false,
                IsNotActive: false,
              }
            });
            if (bankATMCount > 0) {
              return [{ count: BigInt(bankATMCount) }];
            }
          }
          // Fallback to ATM table
          if (prisma.aTM) {
            const atmCount = await prisma.aTM.count();
            return [{ count: BigInt(atmCount) }];
          }
          return [{ count: BigInt(0) }];
        })(),
        5000,
        'ATM count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      withTimeout(
        (async () => {
          // Try WorkPlan table first (new table)
          if (prisma.workPlan) {
            const workPlanCount = await prisma.workPlan.count();
            return [{ count: BigInt(workPlanCount) }];
          }
          // Fallback to WorkPlanHeaders (old table)
          if (prisma.workPlanHeaders) {
            const headersCount = await prisma.workPlanHeaders.count({
              where: {
                IsDeleted: false,
                IsNotActive: false,
              }
            });
            return [{ count: BigInt(headersCount) }];
          }
          return [{ count: BigInt(0) }];
        })(),
        5000,
        'Work plans count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      withTimeout(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM [dbo].[AspNetUsers]
          WHERE [EmailConfirmed] = 1
        `,
        5000,
        'Users count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      withTimeout(
        (async () => {
          // Try BankATM first
          if (prisma.bankATM) {
            const bankATMCount = await prisma.bankATM.count({
              where: {
                IsDeleted: false,
                IsNotActive: false,
              }
            });
            if (bankATMCount > 0) {
              // Use raw SQL for BankATM
              const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
                SELECT COUNT(DISTINCT bc.[BankId]) as count 
                FROM [dbo].[BankCode] bc
                INNER JOIN [dbo].[BankATM] ba ON bc.[BankId] = ba.[BankCodeId]
                WHERE ba.[IsDeleted] = 0 AND ba.[IsNotActive] = 0
              `;
              return result;
            }
          }
          // Fallback to ATM table - count distinct bank names
          if (prisma.aTM) {
            const atms = await prisma.aTM.findMany({
              select: {
                bankName: true,
              }
            });
            const uniqueBanks = new Set(atms.map(atm => atm.bankName).filter(Boolean));
            return [{ count: BigInt(uniqueBanks.size) }];
          }
          return [{ count: BigInt(0) }];
        })(),
        5000,
        'Banks count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      // Representatives count
      withTimeout(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM [dbo].[DelegateData] 
          WHERE [Isdeleted] = 0 AND [IsNotactive] = 0
        `,
        5000,
        'Representatives count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      // Total comments count
      withTimeout(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM [dbo].[ClientComment]
        `,
        5000,
        'Total comments count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      // Unread comments count
      withTimeout(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM [dbo].[ClientComment]
          WHERE [isRead] = 0
        `,
        5000,
        'Unread comments count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      // Work plan status counts - use WorkPlan table if exists
      withTimeout(
        (async () => {
          if (prisma.workPlan) {
            const statusCounts = await prisma.workPlan.groupBy({
              by: ['status'],
              _count: true,
            });
            return statusCounts.map(sc => ({
              status: sc.status,
              count: BigInt(sc._count)
            }));
          }
          return [];
        })(),
        5000,
        'Work plan status count query timeout'
      ).catch(() => {
        // If WorkPlan table doesn't exist, return empty array
        // Status counts will default to 0
        return [];
      }),
      // Use optimized query for ATMs by bank - check both tables
      withTimeout(
        (async () => {
          // Try BankATM first
          if (prisma.bankATM) {
            const bankATMCount = await prisma.bankATM.count({
              where: {
                IsDeleted: false,
                IsNotActive: false,
              }
            });
            if (bankATMCount > 0) {
              // Use raw SQL for BankATM grouping
              const result = await prisma.$queryRaw<Array<{ BankCodeId: bigint | null, count: bigint }>>`
                SELECT [BankCodeId], COUNT([ATMId]) as count
                FROM [dbo].[BankATM]
                WHERE [IsDeleted] = 0 AND [IsNotActive] = 0
                GROUP BY [BankCodeId]
              `;
              return result;
            }
          }
          // Fallback to ATM table - group by bankName
          if (prisma.aTM) {
            const atms = await prisma.aTM.findMany({
              select: {
                bankName: true,
              }
            });
            // Group by bankName manually
            const bankCounts = new Map<string, number>();
            atms.forEach(atm => {
              const bankName = atm.bankName || 'Unknown';
              bankCounts.set(bankName, (bankCounts.get(bankName) || 0) + 1);
            });
            // Return in format compatible with existing code
            // We'll use bankName directly instead of BankCodeId
            return Array.from(bankCounts.entries()).map(([bankName, count]) => ({
              BankCodeId: null,
              bankName: bankName,
              count: BigInt(count)
            })) as any;
          }
          return [];
        })(),
        8000,
        'ATMs by bank query timeout'
      ).catch(() => []),
    ]);

    // Extract counts from results
    const atmsCount = Number(atmsCountResult[0]?.count || 0);
    const workPlansCount = Number(workPlansCountResult[0]?.count || 0);
    const usersCount = Number(usersCountResult[0]?.count || 0);
    const banksCount = Number(banksCountResult[0]?.count || 0);
    const representativesCount = Number(representativesCountResult[0]?.count || 0);
    const totalComments = Number(totalCommentsResult[0]?.count || 0);
    const unreadComments = Number(unreadCommentsResult[0]?.count || 0);
    
    // Extract work plan status counts from grouped result
    const workPlanStatusCounts = workPlanStatusCountsResult as Array<{ status: string, count: bigint }>;
    const completedWorkPlans = Number(
      workPlanStatusCounts.find(s => s.status === 'completed')?.count || 0
    );
    const pendingWorkPlans = Number(
      workPlanStatusCounts.find(s => s.status === 'pending')?.count || 0
    );
    const inProgressWorkPlans = Number(
      workPlanStatusCounts.find(s => s.status === 'in-progress')?.count || 0
    );

    // Build ATM counts by bank
    // Check if we have bankName directly (from ATM table) or need to fetch from BankCode
    const atmsByBankData = atmsByBankRaw
      .map(item => {
        // If item has bankName directly (from ATM table fallback)
        if ((item as any).bankName) {
          return {
            bankName: (item as any).bankName,
            count: Number(item.count || 0),
          };
        }
        // Otherwise, we need to fetch bank name from BankCode using BankCodeId
        return {
          bankCodeId: item.BankCodeId,
          count: Number(item.count || 0),
        };
      })
      .filter(item => item.count > 0);

    // If we have bankCodeIds, fetch bank names
    const bankCodeIds = atmsByBankData
      .map(item => (item as any).bankCodeId)
      .filter((id): id is bigint => id !== null && id !== undefined)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

    if (bankCodeIds.length > 0 && prisma.bankCode) {
      const banks = await prisma.bankCode.findMany({
        where: {
          BankId: {
            in: bankCodeIds,
          },
        },
        select: {
          BankId: true,
          BanknameL1: true,
          BanknameL2: true,
        },
      }).catch(() => []);

      const bankMap = new Map(banks.map(bank => [bank.BankId.toString(), bank.BanknameL1 || bank.BanknameL2 || 'Unknown']));
      
      // Update items that need bank names
      const finalAtmsByBank = atmsByBankData.map(item => {
        if ((item as any).bankName) {
          return item as { bankName: string; count: number };
        }
        const bankCodeId = (item as any).bankCodeId;
        return {
          bankName: bankMap.get(bankCodeId?.toString() || '') || 'Unknown',
          count: item.count,
        };
      }).filter(item => item.bankName !== 'Unknown')
        .sort((a, b) => b.count - a.count);
      
      // Replace the array
      atmsByBankData.length = 0;
      atmsByBankData.push(...finalAtmsByBank);
    } else {
      // Already have bank names, just sort
      const finalData = atmsByBankData
        .filter(item => (item as any).bankName)
        .map(item => ({
          bankName: (item as any).bankName,
          count: item.count,
        }))
        .sort((a, b) => b.count - a.count);
      
      atmsByBankData.length = 0;
      atmsByBankData.push(...finalData);
    }

    const response = NextResponse.json({
      totalATMs: atmsCount,
      totalWorkPlans: workPlansCount,
      totalUsers: usersCount,
      totalBanks: banksCount,
      totalRepresentatives: representativesCount,
      totalComments: totalComments,
      unreadComments: unreadComments,
      completedWorkPlans: completedWorkPlans,
      pendingWorkPlans: pendingWorkPlans,
      inProgressWorkPlans: inProgressWorkPlans,
      atmsByBank: atmsByBankData,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

