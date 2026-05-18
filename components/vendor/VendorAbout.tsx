import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorAboutProps {
  description: string;
  isOnlineOnly: boolean;
  hours?: Record<string, string>;
  location?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
    social: {
      facebook: string;
      instagram: string;
      twitter: string;
    };
  };
}

export function VendorAbout({ description, isOnlineOnly, hours, location, contact }: VendorAboutProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">About Us</h2>
          <p className="text-gray-600">{description}</p>
        </Card>

        {!isOnlineOnly && hours && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
            <div className="space-y-2">
              {Object.entries(hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="font-medium">{day}</span>
                  <span className="text-gray-600">{hours}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {!isOnlineOnly && location && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                  <p>{location.address}</p>
                  <p>{location.city}, {location.state} {location.zip}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-48 bg-gray-100 rounded-lg">
              {/* Map would go here */}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-500" />
              <a href={`tel:${contact.phone}`} className="hover:text-primary">
                {contact.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary">
                {contact.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                {contact.website}
              </a>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" size="icon">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Twitter className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}