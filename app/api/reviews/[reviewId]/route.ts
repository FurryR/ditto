import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Review } from '@/lib/typeorm/entities/Review';
import { ReviewLike } from '@/lib/typeorm/entities/ReviewLike';
import { TemplateStats } from '@/lib/typeorm/entities/TemplateStats';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// DELETE /api/reviews/[reviewId] - Delete a review
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
    const reviewsRepo = await getRepository(Review);

    // Find the review
    const review = await reviewsRepo.findOne({
      where: { id: reviewId },
      relations: ['replies'],
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if the user owns this review
    if (review.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all associated likes first
    const likesRepo = await getRepository(ReviewLike);
    await likesRepo.delete({ reviewId });

    // If this review has replies, delete their likes too
    if (review.replies && review.replies.length > 0) {
      for (const reply of review.replies) {
        await likesRepo.delete({ reviewId: reply.id });
      }
    }

    // If this is a top-level review, update template stats
    if (!review.parentId) {
      const statsRepo = await getRepository(TemplateStats);
      const stats = await statsRepo.findOne({
        where: { templateId: review.templateId },
      });

      if (stats) {
        // Count how many reviews will be deleted (parent + replies)
        const deletedCount = 1 + (review.replies?.length || 0);
        
        // Update stats
        await statsRepo.update(
          { templateId: review.templateId },
          {
            reviewsCount: Math.max(0, (stats.reviewsCount || 0) - deletedCount),
            // Recalculate average rating by removing this review's rating
            averageRating: stats.reviewsCount > 1 
              ? ((stats.averageRating || 0) * stats.reviewsCount - (review.rating || 0)) / (stats.reviewsCount - 1)
              : 0,
          }
        );
      }
    }

    // Delete the review (this will cascade to replies if configured)
    await reviewsRepo.remove(review);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
