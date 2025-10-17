import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all comments for a specific work plan and ATM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workPlanId = searchParams.get('workPlanId');
    const atmCode = searchParams.get('atmCode');

    if (!workPlanId) {
      return NextResponse.json(
        { error: 'workPlanId is required' },
        { status: 400 }
      );
    }

    const where: any = {
      workPlanId: parseInt(workPlanId),
    };

    if (atmCode) {
      where.atmCode = atmCode;
    }

    const comments = await prisma.clientComment.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group comments by parent-child relationship
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return NextResponse.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST: Create a new comment or reply
export async function POST(request: NextRequest) {
  console.log('=== POST /api/client-comments called ===');
  
  try {
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const {
      workPlanId,
      atmCode,
      imageUrl,
      imageType,
      commentText,
      commentBy,
      commentByRole,
      parentCommentId,
    } = body;

    // Detailed validation
    if (!workPlanId) {
      console.log('Validation failed: workPlanId is missing');
      return NextResponse.json(
        { error: 'workPlanId is required' },
        { status: 400 }
      );
    }

    if (!atmCode) {
      console.log('Validation failed: atmCode is missing');
      return NextResponse.json(
        { error: 'atmCode is required' },
        { status: 400 }
      );
    }

    if (!commentText || !commentText.trim()) {
      console.log('Validation failed: commentText is missing or empty');
      return NextResponse.json(
        { error: 'commentText is required' },
        { status: 400 }
      );
    }

    if (!commentBy) {
      console.log('Validation failed: commentBy is missing');
      return NextResponse.json(
        { error: 'commentBy is required' },
        { status: 400 }
      );
    }

    if (!commentByRole) {
      console.log('Validation failed: commentByRole is missing');
      return NextResponse.json(
        { error: 'commentByRole is required' },
        { status: 400 }
      );
    }

    console.log('All validations passed. Creating comment...');
    console.log('Creating comment with data:', {
      workPlanId: parseInt(workPlanId),
      atmCode,
      imageUrl: imageUrl ? 'present' : 'none',
      imageType,
      commentText: commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText,
      commentBy,
      commentByRole,
      parentCommentId,
    });

    const comment = await prisma.clientComment.create({
      data: {
        workPlanId: parseInt(workPlanId),
        atmCode,
        imageUrl,
        imageType,
        commentText,
        commentBy,
        commentByRole,
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
        isRead: false,
        status: 'open',
        updatedAt: new Date(),
      },
    });

    console.log('Comment created successfully with ID:', comment.id);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('=== ERROR in POST /api/client-comments ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to create comment',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}

// PUT: Update a comment (mark as read, change status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
    }

    if (status) {
      updateData.status = status;
    }

    const comment = await prisma.clientComment.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    await prisma.clientComment.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

