import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('work_likes')
export class WorkLike {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'work_id' })
  workId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
