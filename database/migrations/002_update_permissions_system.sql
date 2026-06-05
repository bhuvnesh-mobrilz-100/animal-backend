-- =============================
-- 1. CREATE USERS TABLE (IF NOT EXISTS)
-- =============================
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    surname TEXT,
    phone TEXT,
    device_type TEXT,
    profile_image_url TEXT,
    auth_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- 2. CREATE USER ROLES TABLE (IF NOT EXISTS)
-- =============================
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES public.roles(role_id) ON DELETE CASCADE,
    vet_id BIGINT NULL,
    breeder_id BIGINT NULL,
    pet_friendly_place_id BIGINT NULL,
    service_provider_id BIGINT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- =============================
-- 3. ADD ADDITIONAL PERMISSIONS (only new ones)
-- =============================
INSERT INTO public.permissions (name, description, resource, action) VALUES
('pet_friendly_places.view', 'View pet friendly places', 'pet_friendly_places', 'read'),
('pet_friendly_places.create', 'Create pet friendly places', 'pet_friendly_places', 'create'),
('pet_friendly_places.update', 'Update pet friendly places', 'pet_friendly_places', 'update'),
('pet_friendly_places.delete', 'Delete pet friendly places', 'pet_friendly_places', 'delete'),
('events.view', 'View events', 'events', 'read'),
('events.create', 'Create events', 'events', 'create'),
('events.update', 'Update events', 'events', 'update'),
('events.delete', 'Delete events', 'events', 'delete'),
('help_requests.view', 'View help requests', 'help_requests', 'read'),
('help_requests.create', 'Create help requests', 'help_requests', 'create'),
('help_requests.update', 'Update help requests', 'help_requests', 'update'),
('help_requests.delete', 'Delete help requests', 'help_requests', 'delete'),
('posts.view', 'View posts', 'posts', 'read'),
('posts.create', 'Create posts', 'posts', 'create'),
('posts.update', 'Update posts', 'posts', 'update'),
('posts.delete', 'Delete posts', 'posts', 'delete'),
('reviews.view', 'View reviews', 'reviews', 'read'),
('reviews.create', 'Create reviews', 'reviews', 'create'),
('reviews.update', 'Update reviews', 'reviews', 'update'),
('reviews.delete', 'Delete reviews', 'reviews', 'delete'),
('notifications.view', 'View notifications', 'notifications', 'read'),
('notifications.create', 'Create notifications', 'notifications', 'create'),
('notifications.update', 'Update notifications', 'notifications', 'update'),
('notifications.delete', 'Delete notifications', 'notifications', 'delete')
ON CONFLICT (name) DO NOTHING;

-- =============================
-- 4. ASSIGN ADMIN PERMISSIONS
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin' AND p.name != 'users.delete'
ON CONFLICT DO NOTHING;

-- =============================
-- 5. ASSIGN MANAGER PERMISSIONS
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Manager' AND p.action IN ('read', 'create', 'update')
ON CONFLICT DO NOTHING;


-- =============================
-- 6. CREATE INDEXES
-- =============================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);