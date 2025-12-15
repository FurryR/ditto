import { DataSource } from 'typeorm';
import { Profile } from './entities/Profile';
import { Template } from './entities/Template';
import { TemplateStats } from './entities/TemplateStats';
import { UserWork } from './entities/UserWork';
import { Post } from './entities/Post';
import { Review } from './entities/Review';
import { ReviewLike } from './entities/ReviewLike';
import { TemplateLike } from './entities/TemplateLike';
import { TemplateFavorite } from './entities/TemplateFavorite';
import { UserFollow } from './entities/UserFollow';
import { Report } from './entities/Report';
import { PostLike } from './entities/PostLike';
import { WorkLike } from './entities/WorkLike';
import { WorkComment } from './entities/WorkComment';
import { WorkCommentLike } from './entities/WorkCommentLike';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Don't auto-sync in production
  logging: false,
  entities: [
    Profile,
    Template,
    TemplateStats,
    UserWork,
    Post,
    Review,
    ReviewLike,
    TemplateLike,
    TemplateFavorite,
    UserFollow,
    Report,
    PostLike,
    WorkLike,
    WorkComment,
    WorkCommentLike,
  ],
  subscribers: [],
  migrations: [],
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize the data source
let isInitialized = false;

export async function getDataSource(): Promise<DataSource> {
  if (!isInitialized) {
    await AppDataSource.initialize();
    isInitialized = true;
  }
  return AppDataSource;
}

// Get repository helper
export async function getRepository<T>(entity: new () => T) {
  const dataSource = await getDataSource();
  return dataSource.getRepository(entity);
}
