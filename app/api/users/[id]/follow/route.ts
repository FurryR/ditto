import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { UserFollow } from '@/lib/typeorm/entities/UserFollow';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/users/[id]/follow - Check if current user follows this user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id: followingId } = await params;
    const followRepo = await getRepository(UserFollow);

    const follow = await followRepo.findOne({
      where: { followerId: userId, followingId },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users/[id]/follow - Follow user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: followingId } = await params;

    if (userId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const followRepo = await getRepository(UserFollow);

    // Check if already following
    const existing = await followRepo.findOne({
      where: { followerId: userId, followingId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }

    // Create follow
    const follow = followRepo.create({ followerId: userId, followingId });
    await followRepo.save(follow);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id]/follow - Unfollow user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: followingId } = await params;
    const followRepo = await getRepository(UserFollow);

    // Find and delete follow
    const follow = await followRepo.findOne({
      where: { followerId: userId, followingId },
    });

    if (!follow) {
      return NextResponse.json({ error: 'Not following' }, { status: 400 });
    }

    await followRepo.remove(follow);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
