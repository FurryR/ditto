import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Review } from '@/lib/typeorm/entities/Review';
import { ReviewLike } from '@/lib/typeorm/entities/ReviewLike';
import { TemplateStats } from '@/lib/typeorm/entities/TemplateStats';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import { IsNull, Not } from 'typeorm';

// GET /api/templates/[id]/reviews - Get all reviews for a template
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviewsRepo = await getRepository(Review);
    const currentUserId = await getCurrentUserId();

    // Get all top-level reviews (not replies) with their replies
    const reviews = await reviewsRepo.find({
      where: { templateId: id, parentId: IsNull() },
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'DESC' },
    });

    // If user is logged in, check which reviews they have liked
    let userLikes: Set<string> = new Set();
    if (currentUserId) {
      const likesRepo = await getRepository(ReviewLike);
      const likes = await likesRepo.find({
        where: { userId: currentUserId },
      });
      userLikes = new Set(likes.map((like) => like.reviewId));
    }

    // Format reviews with liked status
    const formattedReviews = reviews.map((review) => ({
      ...review,
      isLiked: userLikes.has(review.id),
      replies:
        review.replies?.map((reply: any) => ({
          ...reply,
          isLiked: userLikes.has(reply.id),
        })) || [],
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/templates/[id]/reviews - Create a new review or reply
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, rating, parentId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // If this is a reply, rating is not allowed
    if (parentId && rating) {
      return NextResponse.json({ error: 'Replies cannot have ratings' }, { status: 400 });
    }

    // If this is a top-level review, rating is required
    if (!parentId && (rating === undefined || rating === null)) {
      return NextResponse.json({ error: 'Rating is required for reviews' }, { status: 400 });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const reviewsRepo = await getRepository(Review);

    const review = reviewsRepo.create({
      templateId: id,
      userId,
      content,
      rating: parentId ? undefined : rating,
      parentId: parentId || undefined,
    });

    await reviewsRepo.save(review);

    // If this is a top-level review, update template stats
    if (!parentId) {
      const statsRepo = await getRepository(TemplateStats);

      // Increment review count
      await statsRepo.increment({ templateId: id }, 'reviewsCount', 1);

      // Recalculate average rating
      const allReviews = await reviewsRepo.find({
        where: {
          templateId: id,
          parentId: IsNull(),
          rating: Not(IsNull()),
        },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

      await statsRepo.update({ templateId: id }, { averageRating: avgRating });
    }

    // Fetch the created review with user info
    const createdReview = await reviewsRepo.findOne({
      where: { id: review.id },
      relations: ['user'],
    });

    return NextResponse.json({ review: createdReview }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
