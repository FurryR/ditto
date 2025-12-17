import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('work_comments')
export class WorkComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'work_id' })
  workId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

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
  @ManyToOne('Profile', (profile: any) => profile.workComments)
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @ManyToOne('UserWork', (work: any) => work.comments)
  @JoinColumn({ name: 'work_id' })
  work?: any;

  @ManyToOne('WorkComment', (comment: any) => comment.replies)
  @JoinColumn({ name: 'parent_id' })
  parent?: any;

  @OneToMany('WorkComment', (comment: any) => comment.parent)
  replies?: any[];
}
