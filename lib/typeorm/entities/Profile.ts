import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true, name: 'github_username' })
  githubUsername?: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true, name: 'display_name' })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'text', nullable: true, name: 'readme_url' })
  readmeUrl?: string;

  @Column({ type: 'jsonb', default: {}, name: 'social_links' })
  socialLinks!: Record<string, any>;

  @Column({ type: 'jsonb', default: {}, name: 'api_settings' })
  apiSettings!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany('Template', (template: any) => template.author)
  templates?: any[];

  @OneToMany('UserWork', (work: any) => work.user)
  works?: any[];

  @OneToMany('Review', (review: any) => review.user)
  reviews?: any[];

  @OneToMany('ReviewLike', (like: any) => like.user)
  reviewLikes?: any[];
}
