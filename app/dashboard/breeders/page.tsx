'use client';

import { BreedersCrud } from "@/components/crud/breeders/BreedersCrud";

export default function BreedersPage() {
  return (
    <div className="w-full">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Breeders Management</h1>
          <p className="text-gray-500">Manage breeders on your platform</p>
        </div>
      </div> */}
      
      <BreedersCrud />
    </div>
  );
}
