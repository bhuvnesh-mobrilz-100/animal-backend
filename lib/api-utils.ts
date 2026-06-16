import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const allowedTables = new Set([
  'users',
  'user_roles',
  'roles',
  'permissions',
  'role_permissions',
  'animal_types',
  'vets',
  'service_provider_breeds',
  'breeds',
  'pet_friendly_places',
  'service_providers',
  'service_categories',
  'events',
  'event_categories',
  'boost_packages',
  'entity_boosts',
  'transactions',
  'locations',
]);

export const primaryKeyMap: Record<string, string> = {
  users: 'user_id',
  user_roles: 'id',
  roles: 'role_id',
  permissions: 'permission_id',
  role_permissions: 'id',
  vets: 'vet_id',
  service_provider_breeds: 'id',
  animal_types: 'animal_type_id',
  breeds: 'breed_id',
  pet_friendly_places: 'pet_friendly_place_id',
  service_providers: 'service_provider_id',
  service_categories: 'service_category_id',
  events: 'event_id',
  event_categories: 'event_category_id',
  boost_packages: 'boost_package_id',
  entity_boosts: 'entity_boost_id',
  transactions: 'transaction_id',
  locations: 'location_id',
};

export function validateTable(table: string | undefined) {
  if (!table || !allowedTables.has(table)) {
    return NextResponse.json({ error: `Table ${table} is not allowed` }, { status: 404 });
  }
  return null;
}

export function getPrimaryKey(table: string, override?: string) {
  if (override) return override;
  return primaryKeyMap[table] ?? 'id';
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const query = {
    select: searchParams.get('select') ?? undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    order: searchParams.get('order') ?? undefined,
    orderBy: searchParams.get('orderBy') ?? undefined,
    filters: [] as Array<{ operator: string; field: string; value: string }>,
  };

  searchParams.forEach((value, key) => {
    if (key === 'select' || key === 'limit' || key === 'offset' || key === 'order' || key === 'orderBy') {
      return;
    }

    const opMapping: Record<string, string> = {
      eq_: 'eq',
      neq_: 'neq',
      lt_: 'lt',
      lte_: 'lte',
      gt_: 'gt',
      gte_: 'gte',
      like_: 'like',
      ilike_: 'ilike',
      is_null_: 'is',
    };

    for (const prefix of Object.keys(opMapping)) {
      if (key.startsWith(prefix)) {
        query.filters.push({ operator: opMapping[prefix], field: key.slice(prefix.length), value });
        return;
      }
    }

    // fallback to eq by direct field name
    query.filters.push({ operator: 'eq', field: key, value });
  });

  return query;
}

export async function buildTableQuery(table: string, searchParams: URLSearchParams) {
  let dbQuery: any = supabaseServer.from(table);
  const parsed = parseSearchParams(searchParams);

  if (parsed.select) {
    dbQuery = dbQuery.select(parsed.select);
  }

  for (const filter of parsed.filters) {
    const { operator, field, value } = filter;
    if (operator === 'is' && (value === 'true' || value === 'false')) {
      dbQuery = dbQuery.is(field, value);
    } else if (operator in dbQuery) {
      dbQuery = dbQuery[operator](field, value);
    }
  }

  if (parsed.orderBy) {
    dbQuery = dbQuery.order(parsed.orderBy, { ascending: parsed.order !== 'desc' });
  }

  if (parsed.limit !== undefined) {
    dbQuery = dbQuery.limit(parsed.limit);
  }

  if (parsed.offset !== undefined) {
    dbQuery = dbQuery.offset(parsed.offset);
  }

  return dbQuery;
}

export async function fetchTableCount(table: string) {
  const { count, error } = await supabaseServer.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    throw error;
  }
  return count ?? 0;
}
