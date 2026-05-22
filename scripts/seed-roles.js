const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE URL or KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ROLES = [
  { name: 'Guest', description: 'Guest (Non-Subscriber)', is_system_role: false },
  { name: 'Subscriber', description: 'Paid or registered subscriber', is_system_role: false },
  { name: 'Provider', description: 'Linked Place Owner / Service Provider', is_system_role: false },
  { name: 'Admin', description: 'Administrator with broad access', is_system_role: false },
  { name: 'Approver', description: 'Approver role for content/workflows', is_system_role: false },
  { name: 'Manager', description: 'Manager role for teams', is_system_role: false },
  { name: 'Owner', description: 'Super Admin / Owner', is_system_role: true },
];

(async () => {
  try {
    // Delete any roles that are not in our list
    const names = ROLES.map(r => r.name);
    await supabase.from('roles').delete().not('name', 'in', `(${names.map(n => `'${n}'`).join(',')})`);

    // Upsert each role (insert if not exists, update if exists)
    for (const role of ROLES) {
      const { error } = await supabase.from('roles').upsert({
        name: role.name,
        description: role.description,
        is_system_role: role.is_system_role,
      }, { onConflict: ['name'] });
      if (error) {
        console.error('Error upserting role', role.name, error.message);
      } else {
        console.log('Upserted role', role.name);
      }
    }

    console.log('Role seeding completed.');
  } catch (err) {
    console.error('Seeding failed', err);
  }
})();
