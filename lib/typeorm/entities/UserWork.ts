import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('user_works')
export class UserWork {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'template_id' })
  templateId?: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'text', array: true, default: [], name: 'character_images' })
  characterImages!: string[];

  @Column({ type: 'text', nullable: true, name: 'prompt_used' })
  promptUsed?: string;

  @Column({ type: 'text', nullable: true, name: 'additional_prompt' })
  additionalPrompt?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  isPublished!: boolean;

  @Column({ type: 'integer', default: 0, name: 'likes_count' })
  likesCount!: number;

  @Column({ type: 'integer', default: 0, name: 'comments_count' })
  commentsCount!: number;

  @Column({ type: 'integer', default: 0, name: 'views_count' })
  viewsCount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'published_at' })
  publishedAt?: Date;

  // Relations
  @ManyToOne('Profile', (profile: any) => profile.works)
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @ManyToOne('Template', (template: any) => template.works)
  @JoinColumn({ name: 'template_id' })
  template?: any;
}
