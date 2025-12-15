import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('template_favorites')
export class TemplateFavorite {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'template_id' })
  templateId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
