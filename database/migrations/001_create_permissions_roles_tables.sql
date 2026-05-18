-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
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
('users.view', 'View users list', 'users', 'read'),
('users.create', 'Create new users', 'users', 'create'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.manage_roles', 'Manage user roles', 'users', 'manage_roles'),
('breeders.view', 'View breeders', 'breeders', 'read'),
('breeders.create', 'Create breeders', 'breeders', 'create'),
('breeders.update', 'Update breeders', 'breeders', 'update'),
('breeders.delete', 'Delete breeders', 'breeders', 'delete'),
('breeds.view', 'View breeds', 'breeds', 'read'),
('breeds.create', 'Create breeds', 'breeds', 'create'),
('breeds.update', 'Update breeds', 'breeds', 'update'),
('breeds.delete', 'Delete breeds', 'breeds', 'delete'),
('veterinarians.view', 'View veterinarians', 'veterinarians', 'read'),
('veterinarians.create', 'Create veterinarians', 'veterinarians', 'create'),
('veterinarians.update', 'Update veterinarians', 'veterinarians', 'update'),
('veterinarians.delete', 'Delete veterinarians', 'veterinarians', 'delete'),
('service_providers.view', 'View service providers', 'service_providers', 'read'),
('service_providers.create', 'Create service providers', 'service_providers', 'create'),
('service_providers.update', 'Update service providers', 'service_providers', 'update'),
('service_providers.delete', 'Delete service providers', 'service_providers', 'delete'),
('transactions.view', 'View transactions', 'transactions', 'read'),
('transactions.create', 'Create transactions', 'transactions', 'create'),
('transactions.update', 'Update transactions', 'transactions', 'update'),
('transactions.delete', 'Delete transactions', 'transactions', 'delete'),
('reports.view', 'View reports', 'reports', 'read'),
('reports.create', 'Create reports', 'reports', 'create'),
('settings.view', 'View settings', 'settings', 'read'),
('settings.update', 'Update settings', 'settings', 'update')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('Super Admin', 'Full system access', true),
('Admin', 'Administrative access', true),
('Manager', 'Management access', true),
('User', 'Basic user access', true),
('Viewer', 'Read-only access', true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Admin gets most permissions except user deletion
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Admin' AND p.name != 'users.delete'
ON CONFLICT DO NOTHING;

-- Manager gets view and create permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Manager' AND p.action IN ('read', 'create', 'update')
ON CONFLICT DO NOTHING;

-- User gets basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'User' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Viewer gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Viewer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
