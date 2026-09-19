-- ==============================================================================
-- TimeMemory: Production Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create MEMORIES Table
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Personal',
    location TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create DIARY_ENTRIES Table
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create MEDIA Table (unified media for memories and diary entries)
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
    diary_id UUID REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'photo' | 'video'
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create TIME_CAPSULES Table
CREATE TABLE IF NOT EXISTS public.time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_path TEXT,
    status TEXT NOT NULL DEFAULT 'locked', -- 'locked' | 'unlocked' | 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Backward compatibility alias view if needed
CREATE OR REPLACE VIEW public.memory_media AS 
SELECT id, memory_id, user_id, file_path, file_type, file_name, created_at 
FROM public.media 
WHERE memory_id IS NOT NULL;

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON public.memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON public.memories(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON public.diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_date ON public.diary_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_memory_id ON public.media(memory_id);
CREATE INDEX IF NOT EXISTS idx_media_diary_id ON public.media(diary_id);
CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_target_date ON public.time_capsules(target_date ASC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Memories Policies (Strict Ownership)
CREATE POLICY "Users can view their own memories"
    ON public.memories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
    ON public.memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
    ON public.memories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
    ON public.memories FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Diary Entries Policies (Strict Ownership)
CREATE POLICY "Users can view their own diary entries"
    ON public.diary_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diary entries"
    ON public.diary_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
    ON public.diary_entries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
    ON public.diary_entries FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Media Policies (Strict Ownership)
CREATE POLICY "Users can view their own media"
    ON public.media FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
    ON public.media FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
    ON public.media FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Time Capsules Policies (Strict Ownership)
CREATE POLICY "Users can view their own time capsules"
    ON public.time_capsules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time capsules"
    ON public.time_capsules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time capsules"
    ON public.time_capsules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time capsules"
    ON public.time_capsules FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKET & POLICIES (memory-media)
-- ==============================================================================

-- Create private bucket for memory media
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-media', 'memory-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Users can only upload and view files in their own user_id directory
CREATE POLICY "Users can upload media to their folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'memory-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'memory-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'memory-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'memory-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
