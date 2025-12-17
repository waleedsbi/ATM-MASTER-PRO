import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { withTimeout } from '@/lib/query-timeout';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch unread comments count for notifications
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma()
    
    // Check if clientComment model exists
    if (!prisma.clientComment) {
      // Return empty notifications if ClientComment model doesn't exist
      // This can happen if the table hasn't been created yet or is in a different database
      console.warn('ClientComment model not found in Prisma client. Returning empty notifications.');
      return NextResponse.json(
        {
          unreadCount: 0,
          recentComments: [],
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get('userRole');
    const showAll = searchParams.get('showAll') === 'true';

    if (!userRole) {
      return NextResponse.json(
        { error: 'userRole is required' },
        { status: 400 }
      );
    }

    // Count unread comments where the user is not the author
    // For clients, count unread comments from reviewers
    // For reviewers, count unread comments from clients
    const oppositeRole = userRole === 'client' ? 'reviewer' : 'client';

    // Use optimized raw SQL queries for better performance
    // This is faster than Prisma ORM for COUNT and filtered queries
    // Add timeout to prevent long-running queries
    const [unreadCountResult, recentComments] = await Promise.all([
      // Use raw SQL for COUNT - much faster
      withTimeout(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM [dbo].[ClientComment] 
          WHERE [commentByRole] = ${oppositeRole} AND [isRead] = 0
        `,
        5000,
        'Unread count query timeout'
      ).catch(() => [{ count: BigInt(0) }]),
      // Use raw SQL for findMany with proper filtering
      withTimeout(
        showAll 
          ? prisma.$queryRaw<Array<{
              id: number,
              workPlanId: number,
              atmCode: string,
              imageUrl: string | null,
              imageType: string | null,
              commentText: string,
              commentBy: string,
              commentByRole: string,
              parentCommentId: number | null,
              isRead: boolean,
              status: string,
              createdAt: Date,
              updatedAt: Date,
            }>>`
              SELECT TOP 20 
                [id], [workPlanId], [atmCode], [imageUrl], [imageType],
                [commentText], [commentBy], [commentByRole], [parentCommentId],
                [isRead], [status], [createdAt], [updatedAt]
              FROM [dbo].[ClientComment]
              WHERE [commentByRole] = ${oppositeRole}
              ORDER BY [createdAt] DESC
            `
          : prisma.$queryRaw<Array<{
              id: number,
              workPlanId: number,
              atmCode: string,
              imageUrl: string | null,
              imageType: string | null,
              commentText: string,
              commentBy: string,
              commentByRole: string,
              parentCommentId: number | null,
              isRead: boolean,
              status: string,
              createdAt: Date,
              updatedAt: Date,
            }>>`
              SELECT TOP 20 
                [id], [workPlanId], [atmCode], [imageUrl], [imageType],
                [commentText], [commentBy], [commentByRole], [parentCommentId],
                [isRead], [status], [createdAt], [updatedAt]
              FROM [dbo].[ClientComment]
              WHERE [commentByRole] = ${oppositeRole} AND [isRead] = 0
              ORDER BY [createdAt] DESC
            `,
        5000,
        'Recent comments query timeout'
      ).catch(() => []),
    ]);

    const unreadCount = Number(unreadCountResult[0]?.count || 0);

    const response = NextResponse.json({
      unreadCount,
      recentComments,
      timestamp: new Date().toISOString(),
    });

    // Cache for 10 seconds - الإشعارات تتغير بشكل متكرر
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');

    return response;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    
    // Check if clientComment model exists
    if (!prisma.clientComment) {
      console.warn('ClientComment model not found in Prisma client. Cannot mark comments as read.');
      return NextResponse.json(
        { error: 'ClientComment model not available', message: 'Comments feature is not available' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { commentIds } = body;

    if (!commentIds || !Array.isArray(commentIds)) {
      return NextResponse.json(
        { error: 'commentIds array is required' },
        { status: 400 }
      );
    }

    if (commentIds.length === 0) {
      return NextResponse.json({ message: 'No comments to mark' });
    }

    const result = await prisma.clientComment.updateMany({
      where: {
        id: {
          in: commentIds.map((id: any) => parseInt(id)),
        },
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Comments marked as read',
      count: result.count 
    });
  } catch (error) {
    console.error('Error marking comments as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark comments as read', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

