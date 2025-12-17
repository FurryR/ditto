export type ImageCategory = 'meme' | 'anime' | 'comic' | 'album-art';
export type LicenseType =
  | 'CC-0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'CC-BY-ND-4.0'
  | 'custom';
export type LicenseRestriction = 'share-alike' | 'no-commercial' | 'no-derivatives' | 'attribution';
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
export type ReviewReactionType = 'helpful' | 'funny' | 'unhelpful';
export type ReportReason = 'spam' | 'inappropriate' | 'copyright' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'template' | 'post' | 'review' | 'user' | 'work';

export interface Template {
  id: string;
  name: string;
  description: string;
  baseImageUrl: string;
  coverImageUrl?: string;
  promptTemplate: string;
  category: ImageCategory;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  modelName: string;
  numCharacters: number;
  licenseType: LicenseType;
  licenseRestrictions: LicenseRestriction[];
  isPublished?: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  templateId: string;
  viewsCount: number;
  likesCount: number;
  usesCount: number;
  favoritesCount: number;
}

export interface Post {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl: string;
  characterImages: string[];
  promptUsed?: string;
  createdAt: string;
  reactions: PostReaction[];
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
}

export interface Review {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reactions: ReviewReaction[];
}

export interface ReviewReaction {
  id: string;
  reviewId: string;
  userId: string;
  reactionType: ReviewReactionType;
  createdAt: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  githubUsername?: string;
  bio?: string;
  readmeUrl?: string;
  socialLinks?: Record<string, string>;
  stats?: {
    templates: number;
    posts: number;
    followers: number;
    following: number;
  };
}

export interface UserWork {
  id: string;
  userId: string;
  templateId: string;
  templateName?: string;
  title?: string;
  imageUrl: string;
  characterImages: string[];
  promptUsed?: string;
  additionalPrompt?: string;
  isPublished: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface UserFollow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface PostLike {
  userId: string;
  postId: string;
  createdAt: string;
}

// Legacy type for backward compatibility
export interface ImageTemplate extends Template {
  imageUrl: string;
  likes: number;
  views: number;
}
