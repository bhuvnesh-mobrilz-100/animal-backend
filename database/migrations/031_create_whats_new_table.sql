-- Create whats_new table
CREATE TABLE IF NOT EXISTS public.whats_new (
    whats_new_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions
INSERT INTO public.permissions (name, description, resource, action)
VALUES
    ('whats_new.view', 'View what''s new entries', 'whats_new', 'read'),
    ('whats_new.create', 'Create what''s new entries', 'whats_new', 'create'),
    ('whats_new.update', 'Update what''s new entries', 'whats_new', 'update'),
    ('whats_new.delete', 'Delete what''s new entries', 'whats_new', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Owner role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
    r.role_id,
    p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Owner'
  AND p.resource = 'whats_new'
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whats_new_created_by
    ON public.whats_new(created_by);

CREATE INDEX IF NOT EXISTS idx_whats_new_is_active
    ON public.whats_new(is_active);

CREATE INDEX IF NOT EXISTS idx_whats_new_created_at
    ON public.whats_new(created_at);