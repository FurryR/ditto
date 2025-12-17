import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { WorkComment } from '@/lib/typeorm/entities/WorkComment';
import { WorkCommentLike } from '@/lib/typeorm/entities/WorkCommentLike';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/works/[id]/comments - Get comments for a work
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workId } = await params;
    const commentRepo = await getRepository(WorkComment);

    const comments = await commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.workId = :workId', { workId })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await commentRepo
          .createQueryBuilder('reply')
          .leftJoinAndSelect('reply.user', 'user')
          .where('reply.parentId = :parentId', { parentId: comment.id })
          .orderBy('reply.createdAt', 'ASC')
          .getMany();

        return {
          ...comment,
          replies,
        };
      })
    );

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/works/[id]/comments - Create a comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workId } = await params;
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const commentRepo = await getRepository(WorkComment);
    const workRepo = await getRepository(UserWork);

    const comment = commentRepo.create({
      workId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
    });

    await commentRepo.save(comment);

    // Increment comments count only for top-level comments
    if (!parentId) {
      await workRepo.increment({ id: workId }, 'commentsCount', 1);
    }

    // Load user data
    const commentWithUser = await commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.id = :id', { id: comment.id })
      .getOne();

    return NextResponse.json({ comment: commentWithUser });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
