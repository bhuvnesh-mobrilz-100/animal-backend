import { supabase } from "./supabase";

export interface NameValidationOptions {
  table: string;
  nameField: string;
  excludeId?: number;
  idField?: string;
  additionalFilters?: Record<string, any>;
}

export async function checkNameUniqueness(
  name: string,
  options: NameValidationOptions
): Promise<{ isUnique: boolean; error?: string }> {
  try {
    const { table, nameField, excludeId, idField, additionalFilters } = options;
    
    // Build the query
    let query = supabase
      .from(table)
      .select(idField || 'id')
      .ilike(nameField, name.trim());

    // Add additional filters if provided
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Exclude current item if editing
    if (excludeId && idField) {
      query = query.neq(idField, excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking name uniqueness:', error);
      return { isUnique: false, error: 'Failed to validate name uniqueness' };
    }

    return { isUnique: !data || data.length === 0 };
  } catch (error) {
    console.error('Error in checkNameUniqueness:', error);
    return { isUnique: false, error: 'Failed to validate name uniqueness' };
  }
}

// Specific validation functions for each entity type
export const validateAnimalTypeName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'animal_types',
    nameField: 'name',
    excludeId,
    idField: 'animal_type_id'
  });

export const validateBreedName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'breeds',
    nameField: 'name',
    excludeId,
    idField: 'breed_id'
  });

export const validateBreederName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'breeders',
    nameField: 'name',
    excludeId,
    idField: 'breeder_id',
    additionalFilters: { is_deleted: false }
  });

export const validateVetName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'vets',
    nameField: 'name',
    excludeId,
    idField: 'vet_id',
    additionalFilters: { is_deleted: false }
  });

export const validatePetFriendlyPlaceName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'pet_friendly_places',
    nameField: 'name',
    excludeId,
    idField: 'pet_friendly_place_id',
    additionalFilters: { is_deleted: false }
  });

export const validateServiceProviderName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'service_providers',
    nameField: 'name',
    excludeId,
    idField: 'service_provider_id',
    additionalFilters: { is_deleted: false }
  });

export const validateServiceCategoryName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'service_categories',
    nameField: 'name',
    excludeId,
    idField: 'service_category_id'
  });

export const validateBoostPackageName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'boost_packages',
    nameField: 'name',
    excludeId,
    idField: 'boost_package_id'
  });

export const validateRoleName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'roles',
    nameField: 'name',
    excludeId,
    idField: 'role_id'
  });

export const validateEventCategoryName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'event_categories',
    nameField: 'name',
    excludeId,
    idField: 'event_category_id'
  });

export const validateHelpRequestCategoryName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'help_request_categories',
    nameField: 'name',
    excludeId,
    idField: 'help_request_category_id'
  });

export const validateVendorName = (name: string, excludeId?: number) =>
  checkNameUniqueness(name, {
    table: 'vendors',
    nameField: 'name',
    excludeId,
    idField: 'vendor_id'
  });
