import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', name: 'base_image_url' })
  baseImageUrl!: string;

  @Column({ type: 'text', nullable: true, name: 'cover_image_url' })
  coverImageUrl?: string;

  @Column({ type: 'text', name: 'prompt_template' })
  promptTemplate!: string;

  @Column({ type: 'text' })
  category!: string;

  @Column({ type: 'text', array: true, default: [] })
  tags!: string[];

  @Column({ type: 'uuid', nullable: true, name: 'author_id' })
  authorId?: string;

  @Column({ type: 'text', default: 'sd-1.5', name: 'model_name' })
  modelName!: string;

  @Column({ type: 'integer', default: 1, name: 'num_characters' })
  numCharacters!: number;

  @Column({ type: 'text', default: 'CC-BY-NC-SA-4.0', name: 'license_type' })
  licenseType!: string;

  @Column({ type: 'text', array: true, default: [], name: 'license_restrictions' })
  licenseRestrictions!: string[];

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  isPublished!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'published_at' })
  publishedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('Profile', (profile: any) => profile.templates)
  @JoinColumn({ name: 'author_id' })
  author?: any;

  @OneToOne('TemplateStats', (stats: any) => stats.template)
  stats?: any;

  @OneToMany('UserWork', (work: any) => work.template)
  works?: any[];

  @OneToMany('Review', (review: any) => review.template)
  reviews?: any[];
}
