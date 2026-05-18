'use client';

import { PetFriendlyPlacesCrud } from "@/components/crud/pet-friendly-places/PetFriendlyPlacesCrud";

export default function PetFriendlyPlacesPage() {
  return (
    <div className="w-full ">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pet Friendly Places Management</h1>
          <p className="text-gray-500">Manage pet friendly locations on your platform</p>
        </div>
      </div> */}
      
      <PetFriendlyPlacesCrud />
    </div>
  );
}
