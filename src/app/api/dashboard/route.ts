import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch all data in parallel
    // Primary parallel fetches (tables may be partially present in some envs)
    const [
      atmsCount,
      workPlansCount,
      repsCount,
      commentsCount,
      unreadCommentsCount,
      workPlansByStatus,
      atmsFlat,
      banksCountMaybe,
      banksListMaybe
    ] = await Promise.all([
      prisma.aTM.count(),
      prisma.workPlan.count(),
      prisma.representative.count(),
      prisma.clientComment.count(),
      prisma.clientComment.count({ where: { isRead: false } }),
      prisma.workPlan.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      // Fetch ATM bank names flat (avoid GROUP BY incompatibilities)
      prisma.aTM.findMany({ select: { bankName: true } }),
      // These two may fail if Bank table is not migrated yet
      prisma.bank.count().catch(() => -1),
      prisma.bank.findMany({ select: { name: true } }).catch(() => [] as { name: string }[]),
    ]);

    // Transform work plans by status
    const completedWorkPlans = workPlansByStatus.find(s => s.status === 'completed')?._count.status || 0;
    const pendingWorkPlans = workPlansByStatus.find(s => s.status === 'pending')?._count.status || 0;
    const inProgressWorkPlans = workPlansByStatus.find(s => s.status === 'in-progress')?._count.status || 0;

    // Build ATM counts map from flat list
    const atmCountByBankName = new Map<string, number>();
    for (const row of atmsFlat) {
      const key = row.bankName;
      atmCountByBankName.set(key, (atmCountByBankName.get(key) ?? 0) + 1);
    }

    // Use banks table as source of truth; include banks with zero ATMs
    // If banks table available use it as source of truth; otherwise derive from ATMs
    const sourceBanks = (Array.isArray(banksListMaybe) && banksListMaybe.length > 0)
      ? banksListMaybe.map((b) => b.name)
      : Array.from(atmCountByBankName.keys());

    const atmsByBankData = sourceBanks
      .map((b) => ({
        bankName: b,
        count: atmCountByBankName.get(b) ?? 0,
      }))
      // Sort descending by count for nicer display
      .sort((a, b) => b.count - a.count);

    const totalBanks = banksCountMaybe !== -1 ? banksCountMaybe : atmsByBankData.length;

    return NextResponse.json({
      totalATMs: atmsCount,
      totalWorkPlans: workPlansCount,
      totalRepresentatives: repsCount,
      totalComments: commentsCount,
      unreadComments: unreadCommentsCount,
      completedWorkPlans,
      pendingWorkPlans,
      inProgressWorkPlans,
      totalBanks,
      atmsByBank: atmsByBankData,
      workPlansByStatus: workPlansByStatus.map(s => ({
        status: s.status,
        count: s._count.status
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

