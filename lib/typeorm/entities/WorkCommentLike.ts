import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('work_comment_likes')
export class WorkCommentLike {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'comment_id' })
  commentId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
