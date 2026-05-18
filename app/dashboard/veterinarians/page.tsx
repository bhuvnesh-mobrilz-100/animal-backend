'use client';

import { VetsCrud } from "@/components/crud/vets/VetsCrud";

export default function VeterinariansPage() {
  return (
    <div className="w-full ">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Veterinarians Management</h1>
          <p className="text-gray-500">Manage veterinarians on your platform</p>
        </div>
      </div> */}
      
      <VetsCrud />
    </div>
  );
}
