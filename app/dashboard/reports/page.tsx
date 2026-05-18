'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from "@/components/tabel/data-table";
import { getReportsColumns } from "./columns";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { hashids } from "@/lib/hashids";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRedemptions: 0,
    redemptionRate: 0,
    totalRevenue: 0,
    failedRedemptions: 0,
    redemptionRateChange: 0,
    revenueChange: 0,
    failedChange: 0,
    redemptionsChange: 0
  });

  useEffect(() => {
    getVouchersData();
    calculateMetrics();
  }, []);

  const getVouchersData = async () => {
    setIsLoading(true);
    try {
      let { data: vouchers, error } = await supabase
        .from("vouchers")
        .select(`
          voucher_id,
          user_id,
          vendor_id,
          purchaser_id,
          gift_idea_id,
          amount,
          remaining_amount,
          image_url,
          created_at,
          expires_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vouchers:', error);
      } else {
        setVouchers(vouchers || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = async () => {
    try {
      // Get all vouchers for metrics calculation
      const { data: allVouchers } = await supabase
        .from("vouchers")
        .select("amount, remaining_amount, expires_at, created_at");

      if (allVouchers) {
        const now = new Date();
        
        // Total redemptions (vouchers with some amount used)
        const totalRedemptions = allVouchers.filter(v => v.remaining_amount < v.amount).length;
        
        // Failed redemptions (expired vouchers with unused amount)
        const failedRedemptions = allVouchers.filter(v => 
          v.expires_at && new Date(v.expires_at) < now && v.remaining_amount > 0
        ).length;
        
        // Total revenue (sum of redeemed amounts)
        const totalRevenue = allVouchers.reduce((sum, v) => 
          sum + (v.amount - v.remaining_amount), 0
        );
        
        // Redemption rate
        const redemptionRate = allVouchers.length > 0 
          ? (totalRedemptions / allVouchers.length) * 100 
          : 0;

        // Mock percentage changes (you can calculate actual changes by comparing with previous period)
        setMetrics({
          totalRedemptions,
          redemptionRate,
          totalRevenue,
          failedRedemptions,
          redemptionsChange: 12.5,
          redemptionRateChange: -2.3,
          revenueChange: 8.7,
          failedChange: -5.2
        });
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const handleView = (row: any) => {
    router.push(`/dashboard/vouchers/${hashids.encode(row.voucher_id)}/view`);
  };

  const exportData = () => {
    // Implement export functionality
    console.log('Exporting data...');
  };

  return (
    <div className="w-full p-6 bg-white relative z-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-500 mt-1">View and analyze your voucher performance data</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Report Type Selector */}
          <Select defaultValue="voucher-redemptions">
            <SelectTrigger className="w-56 bg-white">
              <SelectValue placeholder="Voucher Redemptions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="voucher-redemptions">Voucher Redemptions</SelectItem>
              <SelectItem value="sales-report">Sales Report</SelectItem>
              <SelectItem value="customer-usage">Customer Usage</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Time Period */}
          <Select defaultValue="30">
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Filters Button */}
          <Button variant="outline" className="bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {/* Export Button */}
        <Button variant="outline" className="bg-white" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Redemptions */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Redemptions</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-2xl font-bold mr-2">{metrics.totalRedemptions.toLocaleString()}</h2>
              <div className={`flex items-center text-sm ${metrics.redemptionsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.redemptionsChange >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{metrics.redemptionsChange >= 0 ? '+' : ''}{metrics.redemptionsChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Redemption Rate */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Redemption Rate</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-2xl font-bold mr-2">{metrics.redemptionRate.toFixed(1)}%</h2>
              <div className={`flex items-center text-sm ${metrics.redemptionRateChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.redemptionRateChange >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{metrics.redemptionRateChange >= 0 ? '+' : ''}{metrics.redemptionRateChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Revenue */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-2xl font-bold mr-2">${metrics.totalRevenue.toLocaleString()}</h2>
              <div className={`flex items-center text-sm ${metrics.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Failed Redemptions */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Failed Redemptions</p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-2xl font-bold mr-2">{metrics.failedRedemptions}</h2>
              <div className={`flex items-center text-sm ${metrics.failedChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics.failedChange >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{metrics.failedChange >= 0 ? '+' : ''}{metrics.failedChange}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Redemption Trends */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Redemption Trends</h3>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View Details
              </Button>
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Line Chart Placeholder</p>
                <p className="text-gray-400 text-xs mt-1">Redemption trends over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Voucher Distribution */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Voucher Distribution</h3>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View Details
              </Button>
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Pie Chart Placeholder</p>
                <p className="text-gray-400 text-xs mt-1">Voucher type distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Report */}
      <Card className="bg-white mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Detailed Report</h3>
            <Button variant="ghost" className="text-blue-600">
              View All
            </Button>
          </div>
          
          {/* DataTable Integration */}
          <DataTable
            inputPlaceholder={"Search vouchers..."}
            key={`ReportsTable_${isLoading}`}
            filterAccessorKey="voucher_code"
            columns={getReportsColumns(handleView)}
            data={vouchers}
          />
        </CardContent>
      </Card>
    </div>
  );
}