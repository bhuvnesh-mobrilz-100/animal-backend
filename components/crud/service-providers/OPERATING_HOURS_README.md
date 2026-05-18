# Operating Hours System

This document explains the operating hours system implemented for service providers in the animalClick platform.

## Database Structure

The `operating_hours` field in the `service_providers` table is a JSONB column that stores the business hours for each day of the week.

### JSON Structure

```json
{
  "monday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "tuesday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "wednesday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "thursday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "friday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "saturday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "13:00"
  },
  "sunday": {
    "isOpen": false,
    "openTime": "09:00",
    "closeTime": "17:00"
  }
}
```

### Field Descriptions

- `isOpen`: Boolean indicating if the business is open on this day
- `openTime`: String in 24-hour format (HH:MM) representing opening time
- `closeTime`: String in 24-hour format (HH:MM) representing closing time

## Components

### 1. OperatingHoursTab

**Location**: `Website/components/crud/service-providers/OperatingHoursTab.tsx`

This is the main form component for setting operating hours. It provides:

- **Quick Presets**: Pre-configured hour templates
  - Standard Business (Mon-Fri 9-5, weekends closed)
  - Retail Hours (Mon-Sat 9-6, Sun 10-4)
  - Veterinary Clinic (Mon-Fri 8-6, Sat 8-1, Sun closed)
  - 24/7 Emergency (Always open)

- **Individual Day Configuration**: Set hours for each day individually
- **Bulk Actions**: Open/close all days, reset to defaults
- **Copy Hours**: Copy hours from one day to another
- **Visual Summary**: Shows all hours at a glance

#### Usage in Forms

```tsx
import { OperatingHoursTab } from "./OperatingHoursTab"

// In your form component
<OperatingHoursTab form={form} />
```

### 2. OperatingHoursDisplay

**Location**: `Website/components/crud/service-providers/OperatingHoursDisplay.tsx`

This component displays operating hours in a user-friendly format. It provides:

- **Current Status**: Shows if the business is currently open/closed
- **Today's Hours**: Highlights today's hours
- **Full Week View**: Shows all days with formatted times
- **Compact Mode**: Minimal display for cards/lists

#### Usage Examples

```tsx
import { OperatingHoursDisplay } from "./OperatingHoursDisplay"

// Full display with title
<OperatingHoursDisplay 
  operatingHours={provider.operating_hours} 
  showTitle={true} 
/>

// Compact display for cards
<OperatingHoursDisplay 
  operatingHours={provider.operating_hours} 
  compact={true} 
  className="mt-2"
/>

// Without title
<OperatingHoursDisplay 
  operatingHours={provider.operating_hours} 
  showTitle={false} 
/>
```

#### Utility Functions

```tsx
import { getCurrentStatus, formatDayHours } from "./OperatingHoursDisplay"

// Get current open/closed status
const status = getCurrentStatus(provider.operating_hours)
console.log(status.isOpen) // true/false
console.log(status.message) // "Open until 5:00 PM" or "Closed today"

// Format hours for a specific day
const mondayHours = formatDayHours(provider.operating_hours.monday)
console.log(mondayHours) // "9:00 AM - 5:00 PM" or "Closed"
```

## Schema Integration

The operating hours are integrated into the Zod schema with proper validation:

```typescript
operating_hours: z.object({
  monday: z.object({
    isOpen: z.boolean(),
    openTime: z.string(),
    closeTime: z.string()
  }).optional(),
  // ... other days
}).optional()
```

## Form Integration

### ServiceProviderWizard

The operating hours tab is integrated as step 3 in the wizard:

1. Basic Info
2. Contact & Location
3. **Operating Hours** ← New step
4. Settings
5. Services & Breeds

### ServiceProviderForm

The operating hours tab is added as the third tab in the edit form:

1. Basic Info
2. Contact & Location
3. **Operating Hours** ← New tab
4. Settings

## Database Queries

### Fetching with Operating Hours

```sql
SELECT 
  *,
  operating_hours
FROM service_providers 
WHERE service_provider_id = $1;
```

### Filtering by Current Status

```sql
-- Find providers open on Monday
SELECT * FROM service_providers 
WHERE operating_hours->>'monday'->>'isOpen' = 'true';

-- Find providers open right now (requires application logic)
-- This would need to be handled in the application layer
```

## Best Practices

### 1. Default Hours

Always provide sensible defaults when creating new providers:

```typescript
const DEFAULT_HOURS = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  saturday: { isOpen: true, openTime: "09:00", closeTime: "13:00" },
  sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
}
```

### 2. Time Format

Always use 24-hour format (HH:MM) for storage, but display in 12-hour format for users.

### 3. Validation

Ensure closing time is after opening time:

```typescript
const validateHours = (openTime: string, closeTime: string) => {
  const open = new Date(`2000-01-01T${openTime}`)
  const close = new Date(`2000-01-01T${closeTime}`)
  return close > open
}
```

### 4. Null Handling

Always check for null/undefined operating hours:

```typescript
if (!provider.operating_hours) {
  return <div>Hours not set</div>
}
```

## Future Enhancements

### 1. Special Hours

Support for holiday hours, temporary closures, etc.:

```json
{
  "regular": { /* normal hours */ },
  "special": [
    {
      "date": "2024-12-25",
      "isOpen": false,
      "reason": "Christmas Day"
    }
  ]
}
```

### 2. Multiple Time Slots

Support for businesses with split hours:

```json
{
  "monday": {
    "isOpen": true,
    "slots": [
      { "openTime": "09:00", "closeTime": "12:00" },
      { "openTime": "14:00", "closeTime": "18:00" }
    ]
  }
}
```

### 3. Timezone Support

Store timezone information with hours:

```json
{
  "timezone": "Africa/Johannesburg",
  "hours": { /* hours object */ }
}
```

## Migration Notes

If you have existing service providers without operating hours, you can set default hours:

```sql
UPDATE service_providers 
SET operating_hours = '{
  "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  "friday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "13:00"},
  "sunday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"}
}'::jsonb
WHERE operating_hours IS NULL;
