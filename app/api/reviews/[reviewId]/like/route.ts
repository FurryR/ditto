import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Review } from '@/lib/typeorm/entities/Review';
import { ReviewLike } from '@/lib/typeorm/entities/ReviewLike';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/reviews/[reviewId]/like - Check if user has liked a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

    const { reviewId } = await params;
    const likesRepo = await getRepository(ReviewLike);

    const like = await likesRepo.findOne({
      where: { reviewId, userId },
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error) {
    console.error('Error checking review like:', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}

// POST /api/reviews/[reviewId]/like - Like a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await params;
    const likesRepo = await getRepository(ReviewLike);
    const reviewsRepo = await getRepository(Review);

    // Check if already liked
    const existing = await likesRepo.findOne({
      where: { reviewId, userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    // Create like
    const like = likesRepo.create({ reviewId, userId });
    await likesRepo.save(like);

    // Increment like count on review
    await reviewsRepo.increment({ id: reviewId }, 'likesCount', 1);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Error liking review:', error);
    return NextResponse.json({ error: 'Failed to like review' }, { status: 500 });
  }
}

// DELETE /api/reviews/[reviewId]/like - Unlike a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await params;
    const likesRepo = await getRepository(ReviewLike);
    const reviewsRepo = await getRepository(Review);

    // Find and delete like
    const like = await likesRepo.findOne({
      where: { reviewId, userId },
    });

    if (!like) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    await likesRepo.remove(like);

    // Decrement like count on review
    await reviewsRepo.decrement({ id: reviewId }, 'likesCount', 1);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error unliking review:', error);
    return NextResponse.json({ error: 'Failed to unlike review' }, { status: 500 });
  }
}
