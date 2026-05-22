-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('dashboard.view', 'View dashboard', 'dashboard', 'read'),
('users.view', 'View users', 'users', 'read'),
('users.create', 'Create users', 'users', 'create'),
('users.update', 'Update users', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.manage_roles', 'Manage user roles', 'users', 'manage_roles'),
('subscriptions.view', 'View subscription status', 'subscriptions', 'read'),
('subscriptions.update', 'Update subscription status', 'subscriptions', 'update'),
('profiles.view', 'View user profiles', 'profiles', 'read'),
('profiles.update', 'Update user profiles', 'profiles', 'update'),
('groups.view', 'View groups', 'groups', 'read'),
('groups.create', 'Create groups', 'groups', 'create'),
('groups.update', 'Update groups', 'groups', 'update'),
('groups.delete', 'Delete or deactivate groups', 'groups', 'delete'),
('places.view', 'View places', 'places', 'read'),
('places.create', 'Create places', 'places', 'create'),
('places.update', 'Update places', 'places', 'update'),
('places.delete', 'Delete or deactivate places', 'places', 'delete'),
('places.manage_mapping', 'Manage multi-group place mapping', 'places', 'manage_mapping'),
('events.view', 'View events', 'events', 'read'),
('events.create', 'Create events', 'events', 'create'),
('events.update', 'Update events', 'events', 'update'),
('events.delete', 'Delete events', 'events', 'delete'),
('events.approve', 'Approve submitted events', 'events', 'approve'),
('events.expire', 'Expire past events', 'events', 'update'),
('community.view', 'View community posts', 'community', 'read'),
('community.create', 'Create community posts', 'community', 'create'),
('community.update', 'Update community posts', 'community', 'update'),
('community.delete', 'Delete community posts', 'community', 'delete'),
('community.moderate', 'Moderate community content', 'community', 'moderate'),
('reviews.view', 'View reviews', 'reviews', 'read'),
('reviews.create', 'Create reviews', 'reviews', 'create'),
('reviews.update', 'Update reviews', 'reviews', 'update'),
('reviews.delete', 'Delete reviews', 'reviews', 'delete'),
('reviews.approve', 'Approve reviews', 'reviews', 'approve'),
('providers.request_access', 'Request provider access', 'providers', 'create'),
('providers.verify', 'Verify provider ownership', 'providers', 'verify'),
('providers.edit', 'Edit provider place info', 'providers', 'update'),
('providers.promotions', 'Manage provider promotions', 'providers', 'promotions'),
('donations.view', 'View donation campaigns', 'donations', 'read'),
('donations.create', 'Create donation campaigns', 'donations', 'create'),
('donations.update', 'Update donation campaigns', 'donations', 'update'),
('donations.delete', 'Delete donation campaigns', 'donations', 'delete'),
('boosters.view', 'View booster packages', 'boosters', 'read'),
('boosters.create', 'Create booster packages', 'boosters', 'create'),
('boosters.update', 'Update booster packages', 'boosters', 'update'),
('boosters.delete', 'Delete booster packages', 'boosters', 'delete'),
('support.view', 'View support tickets', 'support', 'read'),
('support.create', 'Create support tickets', 'support', 'create'),
('support.update', 'Update support tickets', 'support', 'update'),
('support.respond', 'Respond to support tickets', 'support', 'respond'),
('notifications.view', 'View notifications', 'notifications', 'read'),
('notifications.create', 'Create notifications', 'notifications', 'create'),
('notifications.send', 'Send notifications', 'notifications', 'send'),
('analytics.view', 'View analytics', 'analytics', 'read'),
('audit_logs.view', 'View audit logs', 'audit_logs', 'read'),
('audit_logs.create', 'Record audit logs', 'audit_logs', 'create'),
('search.view', 'Search across groups, places, events, breeds', 'search', 'read')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('Guest', 'Non-subscriber guest access', false),
('Subscriber', 'Subscriber with feature access', false),
('Provider', 'Linked place owner / provider access', false),
('Admin', 'Administrative access with broad permissions', true),
('Approver', 'Approval and moderation access', true),
('Manager', 'Management access for groups, places, and content', true),
('Owner', 'Super admin access with full system control', true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Owner gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Owner'
ON CONFLICT DO NOTHING;

-- Admin gets all permissions except audit log creation and owner-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Admin' AND p.name != 'audit_logs.create'
ON CONFLICT DO NOTHING;

-- Manager gets dashboard, groups, places, events, reviews, donations, boosters, support, notifications, analytics, and search access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Manager'
  AND p.resource IN (
    'dashboard', 'groups', 'places', 'events', 'reviews', 'donations', 'boosters', 'support', 'notifications', 'analytics', 'search'
  )
  AND p.action IN ('read', 'create', 'update', 'approve', 'respond')
ON CONFLICT DO NOTHING;

-- Approver can view and approve content, review moderation, support, and analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Approver'
  AND p.resource IN ('dashboard', 'events', 'reviews', 'community', 'support', 'analytics', 'search')
  AND p.action IN ('read', 'approve', 'moderate', 'respond')
ON CONFLICT DO NOTHING;

-- Provider can manage their linked place and promotions, view groups/places/search
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Provider'
  AND p.name IN (
    'places.view',
    'places.update',
    'providers.edit',
    'providers.promotions',
    'search.view',
    'groups.view',
    'dashboard.view'
  )
ON CONFLICT DO NOTHING;

-- Subscriber can use subscription features, create events, community, reviews, support, and search
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Subscriber'
  AND p.name IN (
    'dashboard.view',
    'subscriptions.view',
    'profiles.view',
    'profiles.update',
    'events.view',
    'events.create',
    'community.view',
    'community.create',
    'community.update',
    'reviews.view',
    'reviews.create',
    'support.view',
    'support.create',
    'search.view'
  )
ON CONFLICT DO NOTHING;

-- Guest has minimal public/search access and support creation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Guest'
  AND p.name IN (
    'dashboard.view',
    'subscriptions.view',
    'profiles.view',
    'groups.view',
    'places.view',
    'events.view',
    'community.view',
    'reviews.view',
    'donations.view',
    'support.create',
    'search.view'
  )
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
