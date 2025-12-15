import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('template_likes')
export class TemplateLike {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'template_id' })
  templateId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
