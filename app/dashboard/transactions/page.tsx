'use client';

import { TransactionsCrud } from "@/components/crud/transactions/TransactionsCrud";

export default function TransactionsPage() {
  return (
    <div className="w-full ">
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions Management</h1>
          <p className="text-gray-500">View and manage transactions on your platform</p>
        </div>
      </div> */}
      
      <TransactionsCrud />
    </div>
  );
}
