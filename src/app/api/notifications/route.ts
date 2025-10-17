import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch unread comments count for notifications
export async function GET(request: NextRequest) {
  try {
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

    const unreadCount = await prisma.clientComment.count({
      where: {
        isRead: false,
        commentByRole: oppositeRole,
      },
    });

    // Get recent comments (both read and unread if showAll is true)
    const whereClause: any = {
      commentByRole: oppositeRole,
    };

    // If not showing all, only show unread
    if (!showAll) {
      whereClause.isRead = false;
    }

    const recentComments = await prisma.clientComment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Increased to show more comments
    });

    return NextResponse.json(
      {
        unreadCount,
        recentComments,
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

