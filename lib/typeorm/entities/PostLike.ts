import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('post_likes')
export class PostLike {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'post_id' })
  postId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
