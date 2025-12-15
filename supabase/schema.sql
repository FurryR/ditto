-- Supabase Database Schema for Ditto

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  github_username TEXT,
  avatar_url TEXT,
  display_name TEXT,
  bio TEXT,
  readme_url TEXT,
  social_links JSONB DEFAULT '{}',
  api_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Image templates table (renamed to templates)
CREATE TABLE public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_image_url TEXT NOT NULL,
  cover_image_url TEXT,
  prompt_template TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('meme', 'anime', 'comic', 'album-art')),
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_name TEXT DEFAULT 'sd-1.5',
  num_characters INTEGER DEFAULT 1,
  license_type TEXT DEFAULT 'CC-BY-NC-SA-4.0',
  license_restrictions TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template statistics
CREATE TABLE public.template_stats (
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE PRIMARY KEY,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table (user creations using templates)
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  character_images TEXT[] DEFAULT '{}',
  prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post reactions
CREATE TABLE public.post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Review reactions
CREATE TABLE public.review_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'funny', 'unhelpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id, reaction_type)
);

-- Likes table
CREATE TABLE public.template_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- Favorites table
CREATE TABLE public.template_favorites (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- User works/creations table
CREATE TABLE public.user_works (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  character_images TEXT[] DEFAULT '{}',
  prompt_used TEXT,
  additional_prompt TEXT,
  is_published BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- User follows table
CREATE TABLE public.user_follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Reports table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('template', 'post', 'review', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'copyright', 'harassment', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Post likes table (separate from reactions)
CREATE TABLE public.post_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Work likes table
CREATE TABLE public.work_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_id UUID REFERENCES public.user_works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- Work comments table
CREATE TABLE public.work_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_id UUID REFERENCES public.user_works(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.work_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work comment likes table
CREATE TABLE public.work_comment_likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.work_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- Indexes for better performance
CREATE INDEX idx_profiles_github_username ON public.profiles(github_username);
CREATE INDEX idx_templates_author ON public.templates(author_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_created_at ON public.templates(created_at DESC);
CREATE INDEX idx_posts_user ON public.posts(user_id);
CREATE INDEX idx_posts_template ON public.posts(template_id);
CREATE INDEX idx_reviews_template ON public.reviews(template_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_user_works_user ON public.user_works(user_id);
CREATE INDEX idx_user_works_template ON public.user_works(template_id);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_work_likes_work ON public.work_likes(work_id);
CREATE INDEX idx_work_likes_user ON public.work_likes(user_id);
CREATE INDEX idx_work_comments_work ON public.work_comments(work_id);
CREATE INDEX idx_work_comments_user ON public.work_comments(user_id);
CREATE INDEX idx_work_comments_parent ON public.work_comments(parent_id);
CREATE INDEX idx_work_comment_likes_comment ON public.work_comment_likes(comment_id);
CREATE INDEX idx_work_comment_likes_user ON public.work_comment_likes(user_id);

-- Enable Row Level Security for all tables
-- No policies are created, so only service role can access
-- This prevents anonymous and authenticated users from accessing data directly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create storage buckets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'upload',
  'upload',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'file',
  'file',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*']
)

CREATE POLICY "Allow authenticated users to upload to file bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'file' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow public read access to file bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'file');

CREATE POLICY "Allow users to delete own files in file bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'file' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to update own files in file bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'file' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for upload bucket
-- All uploads go to upload bucket first (temporary storage)
-- Persistent content is later migrated to file bucket
CREATE POLICY "Allow authenticated users to upload to upload bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'upload' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public read access to upload bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'upload');

CREATE POLICY "Allow users to delete own files in upload bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'upload' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update own files in upload bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'upload' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
