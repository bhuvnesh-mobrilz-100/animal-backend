'use client';

import { AnimalTypesCrud } from "@/components/crud/animal-types/AnimalTypesCrud";

export default function AnimalTypesPage() {
  return (
    <div className="w-full ">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Animal Types Management</h1>
          <p className="text-gray-500">Manage animal types on your platform</p>
        </div>
      </div> */}
      
      <AnimalTypesCrud />
    </div>
  );
}
