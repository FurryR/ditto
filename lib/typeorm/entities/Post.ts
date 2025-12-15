import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, name: 'template_id' })
  templateId?: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'text', array: true, default: [], name: 'character_images' })
  characterImages!: string[];

  @Column({ type: 'text', nullable: true, name: 'prompt_used' })
  promptUsed?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
