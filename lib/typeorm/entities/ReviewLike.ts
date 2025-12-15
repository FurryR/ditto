import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('review_likes')
export class ReviewLike {
  @PrimaryColumn('uuid', { name: 'review_id' })
  reviewId!: string;

  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne('Review', (review: any) => review.likes)
  @JoinColumn({ name: 'review_id' })
  review?: any;

  @ManyToOne('Profile', (profile: any) => profile.reviewLikes)
  @JoinColumn({ name: 'user_id' })
  user?: any;
}
