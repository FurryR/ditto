import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { WorkLike } from '@/lib/typeorm/entities/WorkLike';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/works/[id]/like - Check if user liked the work
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

    const { id: workId } = await params;
    const likeRepo = await getRepository(WorkLike);

    const like = await likeRepo.findOne({
      where: { userId, workId },
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}

// POST /api/works/[id]/like - Toggle like on work
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workId } = await params;
    const likeRepo = await getRepository(WorkLike);
    const workRepo = await getRepository(UserWork);

    const existingLike = await likeRepo.findOne({
      where: { userId, workId },
    });

    if (existingLike) {
      // Unlike
      await likeRepo.remove(existingLike);

      // Decrement likes count
      await workRepo.decrement({ id: workId }, 'likesCount', 1);

      return NextResponse.json({ isLiked: false });
    } else {
      // Like
      const newLike = likeRepo.create({ userId, workId });
      await likeRepo.save(newLike);

      // Increment likes count
      await workRepo.increment({ id: workId }, 'likesCount', 1);

      return NextResponse.json({ isLiked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
