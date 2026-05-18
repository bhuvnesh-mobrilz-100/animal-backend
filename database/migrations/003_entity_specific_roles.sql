-- =============================
-- FILE 3: ENTITY-SPECIFIC ROLE SYSTEM
-- =============================

-- =============================
-- 1. ADD MISSING COLUMN TO ROLES TABLE (IF NOT EXISTS)
-- =============================
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT FALSE;

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
-- 3. INSERT ADDITIONAL PERMISSIONS (ONLY NEW ONES)
-- =============================
INSERT INTO public.permissions (name, description, resource, action) VALUES
-- Breeder specific permissions
('breeder.manage', 'Manage specific breeder', 'breeder', 'manage'),
('breeder.view', 'View specific breeder', 'breeder', 'read'),
('breeder.update', 'Update specific breeder', 'breeder', 'update'),

-- Veterinarian specific permissions
('vet.manage', 'Manage specific vet', 'vet', 'manage'),
('vet.view', 'View specific vet', 'vet', 'read'),
('vet.update', 'Update specific vet', 'vet', 'update'),

-- Service Provider specific permissions
('service_provider.manage', 'Manage specific service provider', 'service_provider', 'manage'),
('service_provider.view', 'View specific service provider', 'service_provider', 'read'),
('service_provider.update', 'Update specific service provider', 'service_provider', 'update'),

-- Pet Friendly Place specific permissions
('pet_friendly_place.manage', 'Manage specific pet friendly place', 'pet_friendly_place', 'manage'),
('pet_friendly_place.view', 'View specific pet friendly place', 'pet_friendly_place', 'read'),
('pet_friendly_place.update', 'Update specific pet friendly place', 'pet_friendly_place', 'update'),

-- Animal Types permissions
('animal_types.view', 'View animal types', 'animal_types', 'read'),
('animal_types.create', 'Create animal types', 'animal_types', 'create'),
('animal_types.update', 'Update animal types', 'animal_types', 'update'),
('animal_types.delete', 'Delete animal types', 'animal_types', 'delete'),

-- Help Requests permissions
('help_requests.view', 'View help requests', 'help_requests', 'read'),
('help_requests.create', 'Create help requests', 'help_requests', 'create'),
('help_requests.update', 'Update help requests', 'help_requests', 'update'),
('help_requests.delete', 'Delete help requests', 'help_requests', 'delete'),

-- Posts permissions
('posts.view', 'View posts', 'posts', 'read'),
('posts.create', 'Create posts', 'posts', 'create'),
('posts.update', 'Update posts', 'posts', 'update'),
('posts.delete', 'Delete posts', 'posts', 'delete'),

-- Reviews permissions
('reviews.view', 'View reviews', 'reviews', 'read'),
('reviews.create', 'Create reviews', 'reviews', 'create'),
('reviews.update', 'Update reviews', 'reviews', 'update'),
('reviews.delete', 'Delete reviews', 'reviews', 'delete'),

-- Notifications permissions
('notifications.view', 'View notifications', 'notifications', 'read'),
('notifications.create', 'Create notifications', 'notifications', 'create'),
('notifications.update', 'Update notifications', 'notifications', 'update'),
('notifications.delete', 'Delete notifications', 'notifications', 'delete')
ON CONFLICT (name) DO NOTHING;

-- =============================
-- 4. INSERT ADDITIONAL ROLES (IF NOT EXISTS)
-- =============================
INSERT INTO public.roles (name, description, is_system_role) VALUES
('Staff', 'Staff member access', false),
('Owner', 'Entity owner access', false),
('Moderator', 'Content moderation access', false)
ON CONFLICT (name) DO NOTHING;

-- =============================
-- 5. ASSIGN MANAGER PERMISSIONS (UPDATED)
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Manager' AND (
  p.action IN ('read', 'create', 'update') OR 
  p.resource IN ('breeder', 'vet', 'service_provider', 'pet_friendly_place')
)
ON CONFLICT DO NOTHING;

-- =============================
-- 6. ASSIGN OWNER PERMISSIONS
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Owner' AND p.resource IN ('breeder', 'vet', 'service_provider', 'pet_friendly_place')
ON CONFLICT DO NOTHING;

-- =============================
-- 7. ASSIGN STAFF PERMISSIONS
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Staff' AND (
  p.resource IN ('breeder', 'vet', 'service_provider', 'pet_friendly_place') AND 
  p.action IN ('read', 'update')
)
ON CONFLICT DO NOTHING;

-- =============================
-- 8. ASSIGN MODERATOR PERMISSIONS
-- =============================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r, public.permissions p
WHERE r.name = 'Moderator' AND p.resource IN ('posts', 'reviews', 'help_requests')
ON CONFLICT DO NOTHING;

-- =============================
-- 9. CREATE INDEXES
-- =============================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- =============================
-- 10. CREATE COMPOSITE INDEX FOR ENTITY LOOKUPS (ONLY IF COLUMNS EXIST)
-- =============================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' AND column_name = 'vet_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_roles_entity_ids ON public.user_roles(vet_id, breeder_id, pet_friendly_place_id, service_provider_id);
    END IF;
END $$;