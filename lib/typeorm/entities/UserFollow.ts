import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('user_follows')
export class UserFollow {
  @PrimaryColumn('uuid', { name: 'follower_id' })
  followerId!: string;

  @PrimaryColumn('uuid', { name: 'following_id' })
  followingId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
