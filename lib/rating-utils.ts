/**
 * Returns the rating label key based on average rating and total review count.
 */
export type RatingLabelKey =
  | 'rating.noReviews'
  | 'rating.overwhelminglyPositive'
  | 'rating.veryPositive'
  | 'rating.mostlyPositive'
  | 'rating.mixed'
  | 'rating.mostlyNegative'
  | 'rating.overwhelminglyNegative';

export function getRatingLabelKey(avgRating: number, totalReviews: number): RatingLabelKey {
  if (totalReviews === 0) return 'rating.noReviews';

  if (avgRating >= 4.5) return 'rating.overwhelminglyPositive';
  if (avgRating >= 4.0) return 'rating.veryPositive';
  if (avgRating >= 3.5) return 'rating.mostlyPositive';
  if (avgRating >= 3.0) return 'rating.mixed';
  if (avgRating >= 2.5) return 'rating.mostlyNegative';
  return 'rating.overwhelminglyNegative';
}

/**
 * Formats numbers for display (e.g. 1234 -> 1.2K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculates the positive ratio
 */
export function getPositiveRatio(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0;
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  return (positiveCount / reviews.length) * 100;
}
