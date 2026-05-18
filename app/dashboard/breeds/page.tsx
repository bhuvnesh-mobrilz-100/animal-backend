'use client';

import { BreedsCrud } from "@/components/crud/breeds/BreedsCrud";

export default function BreedsPage() {
  return (
    <div className="w-full ">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Breeds Management</h1>
          <p className="text-gray-500">Manage animal breeds on your platform</p>
        </div>
      </div> */}
      
      <BreedsCrud />
    </div>
  );
}
