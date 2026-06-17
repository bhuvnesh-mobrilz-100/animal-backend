-- =============================
-- MIGRATION 34: SUPPORT TICKET PERMISSIONS
-- Ensures support ticket permissions are assigned to the correct roles
-- =============================

-- Ensure support permissions exist
INSERT INTO permissions (name, description, resource, action) VALUES
('support.view', 'View support tickets', 'support', 'read'),
('support.create', 'Create support tickets', 'support', 'create'),
('support.update', 'Update support tickets', 'support', 'update'),
('support.respond', 'Respond to support tickets', 'support', 'respond')
ON CONFLICT (name) DO NOTHING;

-- Owner: all support permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Owner'
  AND p.name IN ('support.view', 'support.create', 'support.update', 'support.respond')
ON CONFLICT DO NOTHING;

-- Admin: all support permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Admin'
  AND p.name IN ('support.view', 'support.create', 'support.update', 'support.respond')
ON CONFLICT DO NOTHING;

-- Manager: view, update, and respond to support tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Manager'
  AND p.name IN ('support.view', 'support.update', 'support.respond')
ON CONFLICT DO NOTHING;

-- Approver: view and respond to support tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Approver'
  AND p.name IN ('support.view', 'support.respond')
ON CONFLICT DO NOTHING;

-- Subscriber: view and create support tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Subscriber'
  AND p.name IN ('support.view', 'support.create')
ON CONFLICT DO NOTHING;

-- Guest: create support tickets only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Guest'
  AND p.name = 'support.create'
ON CONFLICT DO NOTHING;
