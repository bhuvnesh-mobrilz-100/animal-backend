"use client";

import { useEffect, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "@/components/tabel/data-table";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Download, Edit } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

export default function PaymentsBillingPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selected_vendor } = useAuth();

  useEffect(() => {
    if (selected_vendor) {
      getPaymentsData();
    }
  }, [selected_vendor]);

  const getPaymentsData = async () => {
    if (!selected_vendor) return;
    
    setIsLoading(true);
    
    // Get payments from vendor_payouts table for the currently selected vendor
    let { data: payments, error }: any = await supabase
      .from("vendor_payouts")
      .select(`
        vendor_payout_id,
        vendor_id,
        vendor_location_id,
        total_amounts,
        status,
        paid_at,
        vendor_bank_account_id,
        payment_proof_url,
        notes,
        created_at
      `)
      .eq('vendor_id', selected_vendor.vendor_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } else {
      setPayments(payments || []);
    }
    setIsLoading(false);
  };

  const handleDownloadReceipt = (payment: any) => {
    // Implement download receipt functionality
    console.log('Download receipt for:', payment.vendor_payout_id);
    if (payment.payment_proof_url) {
      window.open(payment.payment_proof_url, '_blank');
    }
  };

  return (
    <div className="container mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payments & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your payouts, track payment history, and update billing details.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Earnings */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500">Total Earnings</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-lg font-bold mr-2">R45,231.89</h2>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Available Balance */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500">Available Balance</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-lg font-bold mr-2">R12,560.00</h2>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="h-3 w-3" />
                <span>+8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Withdrawals */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500">Pending Withdrawals</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-lg font-bold mr-2">R4,245.00</h2>
              <span className="text-xs text-gray-500">Processing</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Last Payout */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500">Last Payout</p>
            <div className="mt-1">
              <h2 className="text-lg font-bold">R8,450.00</h2>
              <p className="text-xs text-gray-500 mt-1">May 15, 2024</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Payment History</h2>
        <div className="flex gap-3">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            Request Withdrawal
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <DataTable
            inputPlaceholder="Search transactions..."
            key={`Table_${isLoading}`}
            filterAccessorKey="vendor_payout_id"
            columns={getColumns(handleDownloadReceipt)}
            data={payments}
          />
        </CardContent>
      </Card>

      {/* Bank Account and Tax Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Account Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bank Account Details</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="text-sm font-medium">Chase Bank</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Holder</p>
              <p className="text-sm font-medium">John Doe</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="text-sm font-medium">****4589</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Routing Number</p>
              <p className="text-sm font-medium">****1234</p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tax Information</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tax ID</p>
              <p className="text-sm font-medium">12-3456789</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">VAT Number</p>
              <p className="text-sm font-medium">EU123456789</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Billing Address</p>
              <p className="text-sm font-medium">123 Business Street</p>
              <p className="text-sm font-medium">New York, NY 10001</p>
              <p className="text-sm font-medium">United States</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}