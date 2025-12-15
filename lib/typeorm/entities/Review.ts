import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'template_id' })
  templateId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'integer', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId?: string;

  @Column({ type: 'integer', default: 0, name: 'likes_count' })
  likesCount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('Profile', (profile: any) => profile.reviews)
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @ManyToOne('Template', (template: any) => template.reviews)
  @JoinColumn({ name: 'template_id' })
  template?: any;

  @ManyToOne('Review', (review: any) => review.replies)
  @JoinColumn({ name: 'parent_id' })
  parent?: any;

  @OneToMany('Review', (review: any) => review.parent)
  replies?: any[];

  @OneToMany('ReviewLike', (like: any) => like.review)
  likes?: any[];
}
