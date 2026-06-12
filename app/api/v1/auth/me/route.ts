import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { buildAuthProfile } from '@/lib/auth-profile';
import { supabaseAdmin } from '@/lib/server-supabase';
import { uploadAnimalImage } from '@/lib/storage-upload';

async function geocodeLocation(location: string): Promise<{ latitude: number | null; longitude: number | null }> {
  if (!location || location.trim() === '') {
    return { latitude: null, longitude: null };
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API;
  if (!apiKey) {
    console.error('Google Maps API key is missing');
    return { latitude: null, longitude: null };
  }

  try {
    const encodedAddress = encodeURIComponent(location.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      console.warn(`Geocoding failed for "${location}": ${data.status} - ${data.error_message || ''}`);
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error('Google Geocoding request error:', error);
    return { latitude: null, longitude: null };
  }
}

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);

  if (!authUser?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const authProfile = await buildAuthProfile({
    id: authUser.id,
    email: authUser.email,
    roleNames: authUser.roleNames,
  });

  return NextResponse.json({ ...authProfile });
}

function isSerializedFileObject(value: unknown): boolean {
  if (typeof value === 'string') {
    return value === '[object File]' || value === '[object Object]';
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return !('url' in value || value instanceof URL);
  }
  return false;
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!authUser.internalUserId) {
      return NextResponse.json({ error: 'Internal user record not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'surname', 'phone', 'profile_image_url', 'static_location', 'preferred_radius', 'notification_preferences'];

    const contentType = request.headers.get('content-type') || '';
    let updates: Record<string, unknown> = {};

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (field === 'profile_image_url' && isSerializedFileObject(body[field])) {
            return NextResponse.json(
              { error: 'profile_image_url must be a valid image URL string or use multipart/form-data to upload a file' },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        }
      }
    } else {
      const formData = await request.formData();
      const profileImageField = formData.get('profile_image_url');
      if (profileImageField instanceof File) {
        const { url } = await uploadAnimalImage(profileImageField, 'avatars');
        updates.profile_image_url = url;
      } else if (profileImageField && profileImageField.toString() !== '[object File]') {
        updates.profile_image_url = profileImageField.toString();
      } else if (profileImageField) {
        return NextResponse.json(
          { error: 'profile_image_url must be a valid image file or URL string' },
          { status: 400 }
        );
      }

      for (const field of allowedFields) {
        if (field === 'profile_image_url') continue;
        const value = formData.get(field);
        if (value !== null) {
          updates[field] = value.toString();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    if (updates.static_location) {
      const { latitude, longitude } = await geocodeLocation(updates.static_location as string);
      updates.latitude = latitude;
      updates.longitude = longitude;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('user_id', authUser.internalUserId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const authProfile = await buildAuthProfile({
      id: authUser.id,
      email: authUser.email,
      roleNames: authUser.roleNames,
    });

    return NextResponse.json({ ...authProfile });
  } catch (error: any) {
    console.error('PATCH /auth/me error:', error);
    return NextResponse.json({ error: error.message || 'Profile update failed' }, { status: 500 });
  }
}
