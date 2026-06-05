-- =============================
-- FILE 6: CORE ENTITY TABLES AND SEED DATA
-- =============================
-- 1. EXTEND USERS TABLE FOR PROFILE & SUBSCRIPTION FIELDS
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'guest',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS static_location TEXT,
ADD COLUMN IF NOT EXISTS preferred_radius INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"events": true, "warnings": true, "updates": true}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'guest';
-- 2. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    group_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. PLACE GROUP MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.place_groups (
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES public.groups(group_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (place_id, group_id)
);
-- 4. ANIMAL TYPES TABLE
CREATE TABLE IF NOT EXISTS public.animal_types (
    animal_type_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 5. PLACE ANIMAL TYPES MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.place_animal_types (
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    animal_type_id BIGINT REFERENCES public.animal_types(animal_type_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (place_id, animal_type_id)
);
-- 6. EVENT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.event_categories (
    event_category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 7. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT NOT NULL,
    location TEXT,
    expiry TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    service_provider_id BIGINT REFERENCES public.service_providers(service_provider_id) ON DELETE SET NULL,
    event_category_id BIGINT REFERENCES public.event_categories(event_category_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 8. COMMUNITY POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
    post_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    title TEXT,
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 9. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id BIGINT REFERENCES public.community_posts(post_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);
-- 10. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_blocks (
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    blocked_user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, blocked_user_id)
);
-- 11. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, place_id)
);
-- 12. PROVIDER ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.provider_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 13. RESCUE CENTRES TABLE
CREATE TABLE IF NOT EXISTS public.rescue_centres (
    rescue_centre_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 14. DONATION CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
    campaign_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rescue_centre_id BIGINT REFERENCES public.rescue_centres(rescue_centre_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    monthly_target NUMERIC(12,2),
    visible BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 15. BOOST PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.boost_packages (
    boost_package_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER DEFAULT 30,
    price NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 16. BOOST PACKAGE LINKING TABLE
CREATE TABLE IF NOT EXISTS public.boost_package_links (
    boost_package_id BIGINT REFERENCES public.boost_packages(boost_package_id) ON DELETE CASCADE,
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES public.groups(group_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (boost_package_id, place_id, group_id)
);
-- 17. ENTITY BOOSTS TABLE
CREATE TABLE IF NOT EXISTS public.entity_boosts (
    entity_boost_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    boost_package_id BIGINT REFERENCES public.boost_packages(boost_package_id) ON DELETE SET NULL,
    vet_id BIGINT REFERENCES public.vets(vet_id) ON DELETE SET NULL,
    breeder_id BIGINT REFERENCES public.breeders(breeder_id) ON DELETE SET NULL,
    pet_friendly_place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE SET NULL,
    service_provider_id BIGINT REFERENCES public.service_providers(service_provider_id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 18. SAVED PLACES TABLE
CREATE TABLE IF NOT EXISTS public.saved_places (
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    place_id BIGINT REFERENCES public.pet_friendly_places(place_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, place_id)
);
-- 18. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    support_ticket_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    initial_message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 19. SUPPORT REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.support_replies (
    support_reply_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    support_ticket_id BIGINT REFERENCES public.support_tickets(support_ticket_id) ON DELETE CASCADE,
    reply TEXT NOT NULL,
    responder_user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 20. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target TEXT DEFAULT 'all',
    level TEXT DEFAULT 'info',
    send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 21. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    audit_log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 22. INDEXES
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON public.groups(is_active);
CREATE INDEX IF NOT EXISTS idx_place_groups_place_id ON public.place_groups(place_id);
CREATE INDEX IF NOT EXISTS idx_place_groups_group_id ON public.place_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_place_animal_types_place_id ON public.place_animal_types(place_id);
CREATE INDEX IF NOT EXISTS idx_animal_types_name ON public.animal_types(name);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_is_approved ON public.events(is_approved);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place_user ON public.reviews(place_id, user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_boost_packages_is_active ON public.boost_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_entity_boosts_active ON public.entity_boosts(is_active);
CREATE INDEX IF NOT EXISTS idx_entity_boosts_package_id ON public.entity_boosts(boost_package_id);
-- 23. DUMMY USERS
INSERT INTO public.users (email, name, surname, password, phone, profile_image_url, subscription_status, subscription_plan, subscription_expires_at, static_location, preferred_radius, user_type)
VALUES
('guest@example.com', 'Guest', 'User', 'guestpass', '0100000000', null, 'guest', null, null, 'Cape Town, South Africa', 10, 'Guest'),
('subscriber@example.com', 'Subscriber', 'Member', 'subscriberpass', '0100000001', null, 'active', 'basic', NOW() + INTERVAL '30 days', 'Johannesburg, South Africa', 20, 'Subscriber'),
('provider@example.com', 'Provider', 'Owner', 'providerpass', '0100000002', null, 'active', 'business', NOW() + INTERVAL '90 days', 'Pretoria, South Africa', 15, 'Provider'),
('admin@example.com', 'Admin', 'User', 'adminpass', '0100000003', null, 'active', 'enterprise', NOW() + INTERVAL '365 days', 'Durban, South Africa', 50, 'Admin'),
('approver@example.com', 'Approver', 'User', 'approverpass', '0100000004', null, 'active', 'pro', NOW() + INTERVAL '365 days', 'Port Elizabeth, South Africa', 30, 'Approver'),
('manager@example.com', 'Manager', 'User', 'managerpass', '0100000005', null, 'active', 'pro', NOW() + INTERVAL '365 days', 'Stellenbosch, South Africa', 40, 'Manager'),
('owner@example.com', 'Owner', 'User', 'ownerpass', '0100000006', null, 'active', 'enterprise', NOW() + INTERVAL '365 days', 'Sandton, South Africa', 60, 'Owner'),
('superadmin@gmail.com', 'Super', 'Admin', 'SuperAdmin@123', '0100000007', null, 'active', 'enterprise', NOW() + INTERVAL '365 days', 'Cape Town, South Africa', 100, 'Owner')
ON CONFLICT (email) DO NOTHING;
-- 24. ASSIGN ROLES TO DUMMY USERS
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Guest'
WHERE u.email = 'guest@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Subscriber'
WHERE u.email = 'subscriber@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Provider'
WHERE u.email = 'provider@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Admin'
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Approver'
WHERE u.email = 'approver@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Manager'
WHERE u.email = 'manager@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Owner'
WHERE u.email = 'owner@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name = 'Owner'
WHERE u.email = 'superadmin@gmail.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, created_at)
SELECT u.user_id, r.role_id, NOW()
FROM public.users u
JOIN public.roles r ON r.name IN ('Guest', 'Subscriber', 'Provider', 'Admin', 'Approver', 'Manager', 'Owner')
WHERE u.email = 'superadmin@gmail.com'
ON CONFLICT DO NOTHING;
-- 25. DUMMY GROUPS
INSERT INTO public.groups (name, description) VALUES
('Pet Friendly Accommodation', 'Places that welcome pets while you travel or work.'),
('Animal Welfare & Rescue', 'Rescue centers and verified shelters supporting animals.'),
('Pet Events & Training', 'Events, classes, and community meetups for pet owners.'),
('Veterinary & Grooming Services', 'Professional veterinary, grooming and healthcare services.')
ON CONFLICT (name) DO NOTHING;
-- 26. DUMMY ANIMAL TYPES
INSERT INTO public.animal_types (name, description) VALUES
('Dogs', 'All dog-focused services and places.'),
('Cats', 'Cat-friendly places and services.'),
('Birds', 'Services and places for bird owners.'),
('Small Pets', 'Small mammals and exotic pet services.')
ON CONFLICT (name) DO NOTHING;
-- 27. DUMMY SERVICE PROVIDERS
INSERT INTO public.service_providers (name, description, address, phone, email, website, service_type, is_verified, user_id)
SELECT v.name, v.description, v.address, v.phone, v.email, v.website, v.service_type, v.is_verified, v.user_id
FROM (VALUES
('Healthy Paws Clinic', 'Full veterinary care for dogs and cats.', '22 Health Street, Cape Town', '0215559001', 'info@healthypaws.example.com', 'https://healthypaws.example.com', 'Veterinary', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com')),
('Groom & Go', 'Professional grooming and styling for all pets.', '14 Pet Lane, Johannesburg', '0115559002', 'hello@groomandgo.example.com', 'https://groomandgo.example.com', 'Grooming', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com'))
) AS v(name, description, address, phone, email, website, service_type, is_verified, user_id)
WHERE NOT EXISTS (
SELECT 1 FROM public.service_providers sp WHERE sp.name = v.name AND sp.address = v.address
);
-- 28. DUMMY VETERINARIANS
INSERT INTO public.vets (name, clinic_name, description, address, phone, emergency_number, email, specialization, is_verified, user_id)
SELECT v.name, v.clinic_name, v.description, v.address, v.phone, v.emergency_number, v.email, v.specialization, v.is_verified, v.user_id
FROM (VALUES
('Dr. Sarah Mkhize', 'Healthy Paws Clinic', 'Small animal and emergency veterinarian.', '22 Health Street, Cape Town', '0215559001', '0215559999', 'sarah@healthypaws.example.com', 'Small Animals', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com')),
('Dr. Ian van der Merwe', 'Urban Pet Health', 'Emergency and wellness veterinary services.', '88 City Veterinary Road, Johannesburg', '0115559003', '0115559998', 'ian@urbanpethealth.example.com', 'Emergency Care', true, (SELECT user_id FROM public.users WHERE email = 'manager@example.com'))
) AS v(name, clinic_name, description, address, phone, emergency_number, email, specialization, is_verified, user_id)
WHERE NOT EXISTS (
SELECT 1 FROM public.vets vt WHERE vt.name = v.name AND vt.clinic_name = v.clinic_name
);
-- 29. DUMMY BREEDERS
INSERT INTO public.breeders (name, description, address, phone, email, website, is_verified, user_id)
SELECT v.name, v.description, v.address, v.phone, v.email, v.website, v.is_verified, v.user_id
FROM (VALUES
('Cape Puppy Breeders', 'Responsible dog breeders with full health screening.', '3 Breeder Road, Cape Town', '0215553333', 'info@capepuppy.example.com', 'https://capepuppy.example.com', true, (SELECT user_id FROM public.users WHERE email = 'subscriber@example.com')),
('Cat Comfort Breeders', 'Premium cat breeding and adoption support.', '6 Felina Street, Johannesburg', '0115553334', 'hello@catcomfort.example.com', 'https://catcomfort.example.com', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com'))
) AS v(name, description, address, phone, email, website, is_verified, user_id)
WHERE NOT EXISTS (
SELECT 1 FROM public.breeders b WHERE b.name = v.name
);
-- 30. DUMMY EVENT CATEGORIES
INSERT INTO public.event_categories (name, description, icon, color) VALUES
('Adoption & Rescue', 'Events focused on adoption and animal rescue.', '❤️', '#EF4444'),
('Health & Wellness', 'Vaccination clinics and wellness check events.', '🩺', '#10B981'),
('Community Meetups', 'Community gatherings for animal lovers.', '🤝', '#3B82F6')
ON CONFLICT (name) DO NOTHING;
-- 28. DUMMY RESCUE CENTRES
INSERT INTO public.rescue_centres (name, description, address, phone, website, is_verified)
SELECT v.name, v.description, v.address, v.phone, v.website, v.is_verified
FROM (VALUES
('SafePaws Rescue', 'Verified rescue centre for at-risk animals.', '34 Rescue Lane, Cape Town', '0215556789', 'https://safepaws.example.com', true),
('SecondChance Shelter', 'Monthly supported shelter and rescue campaigns.', '12 Shelter Road, Johannesburg', '0115551234', 'https://secondchance.example.com', false)
) AS v(name, description, address, phone, website, is_verified)
WHERE NOT EXISTS (
SELECT 1 FROM public.rescue_centres rc WHERE rc.name = v.name
);
-- 29. DUMMY BOOST PACKAGES
INSERT INTO public.boost_packages (name, description, duration_days, price, is_active)
SELECT v.name, v.description, v.duration_days, v.price, v.is_active
FROM (VALUES
('Visibility Booster', 'Featured placement for your listed place or group.', 30, 49.99, true),
('Premium Promotion', 'Higher priority promotion across search and listings.', 60, 99.99, true)
) AS v(name, description, duration_days, price, is_active)
WHERE NOT EXISTS (
SELECT 1 FROM public.boost_packages bp WHERE bp.name = v.name
);
-- 31. DUMMY SUPPORT & NOTIFICATIONS
INSERT INTO public.support_tickets (user_id, subject, initial_message, status, last_reply_at)
SELECT u.user_id, 'Need help with place listing', 'I need assistance updating my place details.', 'open', NOW()
FROM public.users u
WHERE u.email = 'subscriber@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.support_tickets st WHERE st.user_id = u.user_id AND st.subject = 'Need help with place listing'
);
INSERT INTO public.support_tickets (user_id, subject, initial_message, status)
SELECT u.user_id, 'Provider access issue', 'I need help linking my new provider profile.', 'pending'
FROM public.users u
WHERE u.email = 'provider@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.support_tickets st WHERE st.user_id = u.user_id AND st.subject = 'Provider access issue'
);
INSERT INTO public.notifications (title, body, target, level, send_at, status)
SELECT v.title, v.body, v.target, v.level, v.send_at, v.status
FROM (VALUES
('Welcome to Animal Click', 'Your account has been created and is ready to use.', 'all', 'info', NOW(), 'sent'),
('Event approval required', 'New event submissions await approval in the dashboard.', 'Admin', 'warning', NOW() + INTERVAL '1 hour', 'pending')
) AS v(title, body, target, level, send_at, status)
WHERE NOT EXISTS (
SELECT 1 FROM public.notifications n WHERE n.title = v.title AND n.body = v.body
);
-- 31. DUMMY AUDIT LOGS
INSERT INTO public.audit_logs (actor_user_id, action, resource, details)
SELECT u.user_id, 'seed.create', 'system', '{"note":"initial dummy data"}'
FROM public.users u
WHERE u.email = 'owner@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.audit_logs al WHERE al.actor_user_id = u.user_id AND al.action = 'seed.create' AND al.resource = 'system'
);
-- 32. DUMMY PET FRIENDLY PLACES AND LINKING
INSERT INTO public.pet_friendly_places (name, description, address, phone, email, website, place_type, price_range, is_verified, user_id)
SELECT v.name, v.description, v.address, v.phone, v.email, v.website, v.place_type, v.price_range, v.is_verified, v.user_id
FROM (VALUES
('Happy Trails Boarding', 'Safe and spacious boarding for pets of all sizes.', '10 Park Street, Cape Town', '0215552323', 'hello@happytrails.example.com', 'https://happytrails.example.com', 'Boarding', '$$$', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com')),
('Bark & Purr Park', 'Large pet-friendly park with play areas and grooming service.', '75 Greenway Ave, Johannesburg', '0115554343', 'contact@barkpurr.example.com', 'https://barkpurr.example.com', 'Recreation', '$$', true, (SELECT user_id FROM public.users WHERE email = 'provider@example.com'))
) AS v(name, description, address, phone, email, website, place_type, price_range, is_verified, user_id)
WHERE NOT EXISTS (
SELECT 1 FROM public.pet_friendly_places p WHERE p.name = v.name
);
INSERT INTO public.place_groups (place_id, group_id)
SELECT p.place_id, g.group_id
FROM public.pet_friendly_places p, public.groups g
WHERE p.name = 'Happy Trails Boarding' AND g.name = 'Pet Friendly Accommodation'
AND NOT EXISTS (
    SELECT 1 FROM public.place_groups pg WHERE pg.place_id = p.place_id AND pg.group_id = g.group_id
);
INSERT INTO public.place_groups (place_id, group_id)
SELECT p.place_id, g.group_id
FROM public.pet_friendly_places p, public.groups g
WHERE p.name = 'Bark & Purr Park' AND g.name = 'Pet Events & Training'
AND NOT EXISTS (
    SELECT 1 FROM public.place_groups pg WHERE pg.place_id = p.place_id AND pg.group_id = g.group_id
);
INSERT INTO public.place_animal_types (place_id, animal_type_id)
SELECT p.place_id, a.animal_type_id
FROM public.pet_friendly_places p, public.animal_types a
WHERE p.name = 'Happy Trails Boarding' AND a.name = 'Dogs'
AND NOT EXISTS (
    SELECT 1 FROM public.place_animal_types pa WHERE pa.place_id = p.place_id AND pa.animal_type_id = a.animal_type_id
);
INSERT INTO public.place_animal_types (place_id, animal_type_id)
SELECT p.place_id, a.animal_type_id
FROM public.pet_friendly_places p, public.animal_types a
WHERE p.name = 'Bark & Purr Park' AND a.name = 'Cats'
AND NOT EXISTS (
    SELECT 1 FROM public.place_animal_types pa WHERE pa.place_id = p.place_id AND pa.animal_type_id = a.animal_type_id
);
-- 33. DUMMY EVENTS
INSERT INTO public.events (title, description, event_date, venue, location, expiry, is_active, is_approved, user_id, event_category_id)
SELECT 'Community Adoption Day', 'Join our community adoption event for rescued pets.', NOW() + INTERVAL '7 days', 'Bark & Purr Park', 'Johannesburg, South Africa', NOW() + INTERVAL '10 days', true, true, u.user_id, c.event_category_id
FROM public.users u, public.event_categories c
WHERE u.email = 'subscriber@example.com' AND c.name = 'Adoption & Rescue'
AND NOT EXISTS (
    SELECT 1 FROM public.events e WHERE e.title = 'Community Adoption Day'
);
INSERT INTO public.events (title, description, event_date, venue, location, expiry, is_active, is_approved, user_id, event_category_id)
SELECT 'Veterinary Wellness Clinic', 'Free wellness checks and vaccination reminders.', NOW() + INTERVAL '14 days', 'Happy Trails Boarding', 'Cape Town, South Africa', NOW() + INTERVAL '16 days', true, false, u.user_id, c.event_category_id
FROM public.users u, public.event_categories c
WHERE u.email = 'subscriber@example.com' AND c.name = 'Health & Wellness'
AND NOT EXISTS (
    SELECT 1 FROM public.events e WHERE e.title = 'Veterinary Wellness Clinic'
);
-- 34. DUMMY COMMUNITY POSTS
INSERT INTO public.community_posts (user_id, title, body, is_active)
SELECT u.user_id, 'New dog-friendly event', 'Excited to share a dog-friendly event this weekend.', true
FROM public.users u
WHERE u.email = 'subscriber@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.community_posts cp WHERE cp.user_id = u.user_id AND cp.title = 'New dog-friendly event'
);
-- 35. DUMMY REVIEWS
INSERT INTO public.reviews (user_id, place_id, rating, comment, is_approved)
SELECT u.user_id, p.place_id, 5, 'Amazing boarding service and friendly staff.', true
FROM public.users u, public.pet_friendly_places p
WHERE u.email = 'subscriber@example.com' AND p.name = 'Happy Trails Boarding'
ON CONFLICT DO NOTHING;
-- 36. DUMMY PROVIDER REQUESTS
INSERT INTO public.provider_requests (user_id, place_id, status, notes)
SELECT u.user_id, p.place_id, 'pending', 'Requesting provider access after verifying ownership.'
FROM public.users u, public.pet_friendly_places p
WHERE u.email = 'subscriber@example.com' AND p.name = 'Bark & Purr Park'
AND NOT EXISTS (
    SELECT 1 FROM public.provider_requests pr WHERE pr.user_id = u.user_id AND pr.place_id = p.place_id AND pr.status = 'pending' AND pr.notes = 'Requesting provider access after verifying ownership.'
);
-- 37. DUMMY DONATION CAMPAIGNS
INSERT INTO public.donation_campaigns (rescue_centre_id, title, description, monthly_target, visible, expires_at)
SELECT rc.rescue_centre_id, 'Monthly Rescue Support', 'Help us fund rescue operations for vulnerable animals.', 2500.00, true, NOW() + INTERVAL '60 days'
FROM public.rescue_centres rc
WHERE rc.name = 'SafePaws Rescue'
AND NOT EXISTS (
    SELECT 1 FROM public.donation_campaigns dc WHERE dc.rescue_centre_id = rc.rescue_centre_id AND dc.title = 'Monthly Rescue Support'
);
-- 38. DUMMY BOOST PACKAGE LINKS
INSERT INTO public.boost_package_links (boost_package_id, place_id, group_id, expires_at)
SELECT bp.boost_package_id, p.place_id, g.group_id, NOW() + INTERVAL '30 days'
FROM public.boost_packages bp, public.pet_friendly_places p, public.groups g
WHERE bp.name = 'Visibility Booster' AND p.name = 'Happy Trails Boarding' AND g.name = 'Pet Friendly Accommodation'
ON CONFLICT DO NOTHING;
-- 39. DUMMY ENTITY BOOSTS
INSERT INTO public.entity_boosts (user_id, boost_package_id, service_provider_id, start_date, end_date, is_active)
SELECT u.user_id, bp.boost_package_id, sp.service_provider_id, NOW(), NOW() + INTERVAL '30 days', true
FROM public.users u, public.boost_packages bp, public.service_providers sp
WHERE u.email = 'provider@example.com' AND bp.name = 'Premium Promotion'
AND NOT EXISTS (
    SELECT 1 FROM public.entity_boosts eb WHERE eb.user_id = u.user_id AND eb.boost_package_id = bp.boost_package_id AND eb.service_provider_id = sp.service_provider_id AND eb.is_active = true
)
LIMIT 1;
-- 39. DUMMY SAVED PLACES
INSERT INTO public.saved_places (user_id, place_id)
SELECT u.user_id, p.place_id
FROM public.users u, public.pet_friendly_places p
WHERE u.email = 'subscriber@example.com' AND p.name = 'Happy Trails Boarding'
AND NOT EXISTS (
    SELECT 1 FROM public.saved_places sp WHERE sp.user_id = u.user_id AND sp.place_id = p.place_id
);
-- 40. DUMMY SUPPORT REPLIES
INSERT INTO public.support_replies (support_ticket_id, reply, responder_user_id)
SELECT t.support_ticket_id, 'Thank you — we will review your request and respond shortly.', u.user_id
FROM public.support_tickets t, public.users u
WHERE t.subject = 'Need help with place listing' AND u.email = 'admin@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.support_replies sr WHERE sr.support_ticket_id = t.support_ticket_id AND sr.reply = 'Thank you — we will review your request and respond shortly.' AND sr.responder_user_id = u.user_id
);
-- 41. LINK DUMMY NOTIFICATIONS TO AUDIT LOGS
INSERT INTO public.audit_logs (actor_user_id, action, resource, details)
SELECT u.user_id, 'notification.create', 'notifications', jsonb_build_object('notification', n.title)
FROM public.users u, public.notifications n
WHERE u.email = 'admin@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.audit_logs al WHERE al.actor_user_id = u.user_id AND al.action = 'notification.create' AND al.resource = 'notifications' AND al.details = jsonb_build_object('notification', n.title)
);
-- 42. DUMMY DATABASE COMPLETION NOTE
INSERT INTO public.audit_logs (actor_user_id, action, resource, details)
SELECT u.user_id, 'seed.complete', 'database', '{"note":"Core entity seed data inserted."}'
FROM public.users u
WHERE u.email = 'owner@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.audit_logs al WHERE al.actor_user_id = u.user_id AND al.action = 'seed.complete' AND al.resource = 'database'
);
