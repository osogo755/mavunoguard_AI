-- MavunoGuard AI Database Schema
-- Supabase PostgreSQL Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw', 'ek')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    size DOUBLE PRECISION NOT NULL CHECK (size > 0),
    unit TEXT DEFAULT 'acres' CHECK (unit IN ('acres', 'hectares')),
    crop TEXT NOT NULL,
    variety TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    soil_type TEXT,
    drainage TEXT,
    flood_history TEXT,
    slope TEXT,
    crop_health TEXT,
    current_problems TEXT[] DEFAULT '{}'::TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Farm Observations Table
CREATE TABLE IF NOT EXISTS public.farm_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    observation_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    crop_health TEXT,
    soil_moisture_visual TEXT,
    pest_signs BOOLEAN DEFAULT FALSE,
    disease_signs BOOLEAN DEFAULT FALSE,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Risk Analyses Table
CREATE TABLE IF NOT EXISTS public.risk_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'MODERATE-HIGH', 'HIGH')),
    drought_risk INTEGER NOT NULL CHECK (drought_risk >= 0 AND drought_risk <= 100),
    flood_risk INTEGER NOT NULL CHECK (flood_risk >= 0 AND flood_risk <= 100),
    crop_stress INTEGER NOT NULL CHECK (crop_stress >= 0 AND crop_stress <= 100),
    ndvi DOUBLE PRECISION,
    ndvi_trend TEXT,
    reasons JSONB DEFAULT '[]'::JSONB NOT NULL,
    recommended_actions JSONB DEFAULT '[]'::JSONB NOT NULL,
    watch_next JSONB DEFAULT '[]'::JSONB NOT NULL,
    ai_headline TEXT,
    ai_explanation TEXT,
    ai_provider TEXT,
    weather_source TEXT,
    satellite_source TEXT,
    raw_weather_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Weather Cache Table
CREATE TABLE IF NOT EXISTS public.weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    provider TEXT NOT NULL,
    forecast_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Offline Sync Queue Table
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    synced_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_observations_farm_id ON public.farm_observations(farm_id);
CREATE INDEX IF NOT EXISTS idx_analyses_farm_id ON public.risk_analyses(farm_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.risk_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_cache_coords ON public.weather_cache(latitude, longitude);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Farms Policies
CREATE POLICY "Users can view their own farms"
    ON public.farms FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farms"
    ON public.farms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms"
    ON public.farms FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms"
    ON public.farms FOR DELETE
    USING (auth.uid() = user_id);

-- Farm Observations Policies
CREATE POLICY "Users can view their own observations"
    ON public.farm_observations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own observations"
    ON public.farm_observations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own observations"
    ON public.farm_observations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own observations"
    ON public.farm_observations FOR DELETE
    USING (auth.uid() = user_id);

-- Risk Analyses Policies
CREATE POLICY "Users can view their own risk analyses"
    ON public.risk_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own risk analyses"
    ON public.risk_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Weather Cache Policy (Public authenticated read, server write)
CREATE POLICY "Authenticated users can read cached weather"
    ON public.weather_cache FOR SELECT
    TO authenticated
    USING (true);

-- Sync Queue Policies
CREATE POLICY "Users can manage their sync queue"
    ON public.sync_queue FOR ALL
    USING (auth.uid() = user_id);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, preferred_language)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
