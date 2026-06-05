-- =============================
-- FILE 4: ENTITY TABLES
-- =============================

-- =============================
-- 1. BREEDERS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS public.breeders (
    breeder_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) COMMENT ON TABLE public.breeders IS 'Registered animal breeders';

-- =============================
-- 2. VETS TABLE (WITH EMERGENCY NUMBER)
-- =============================
CREATE TABLE IF NOT EXISTS public.vets (
    vet_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    clinic_name TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    emergency_number TEXT,
    email TEXT,
    specialization TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) COMMENT ON COLUMN public.vets.emergency_number IS 'Emergency contact number for urgent situations';

-- =============================
-- 3. SERVICE PROVIDERS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS public.service_providers (
    service_provider_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    service_type TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- 4. PET FRIENDLY PLACES TABLE
-- =============================
CREATE TABLE IF NOT EXISTS public.pet_friendly_places (
    place_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    place_type TEXT,
    price_range TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- 5. CREATE INDEXES FOR ALL ENTITY TABLES
-- =============================
CREATE INDEX IF NOT EXISTS idx_breeders_user_id ON public.breeders(user_id);
CREATE INDEX IF NOT EXISTS idx_vets_user_id ON public.vets(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_friendly_places_user_id ON public.pet_friendly_places(user_id);