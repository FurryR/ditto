import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';

@Entity('template_stats')
export class TemplateStats {
  @PrimaryColumn('uuid', { name: 'template_id' })
  templateId!: string;

  @Column({ type: 'integer', default: 0, name: 'views_count' })
  viewsCount!: number;

  @Column({ type: 'integer', default: 0, name: 'likes_count' })
  likesCount!: number;

  @Column({ type: 'integer', default: 0, name: 'uses_count' })
  usesCount!: number;

  @Column({ type: 'integer', default: 0, name: 'favorites_count' })
  favoritesCount!: number;

  @Column({ type: 'integer', default: 0, name: 'reviews_count' })
  reviewsCount!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating!: number;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToOne('Template', (template: any) => template.stats)
  @JoinColumn({ name: 'template_id' })
  template?: any;
}
