"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, DollarSign, Calendar } from "lucide-react";

interface BoostStats {
  totalActiveBoosts: number;
  totalRevenue: number;
  expiringThisWeek: number;
  averageBoostDuration: number;
}

export function BoostStats() {
  const [stats, setStats] = useState<BoostStats>({
    totalActiveBoosts: 0,
    totalRevenue: 0,
    expiringThisWeek: 0,
    averageBoostDuration: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoostStats();
  }, []);

  const fetchBoostStats = async () => {
    try {
      // Get all boosts with package info
      const { data: boosts, error } = await supabase
        .from("entity_boosts")
        .select(`
          *,
          boost_packages (
            price,
            duration_days
          )
        `);

      if (error) throw error;

      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);

      let totalActiveBoosts = 0;
      let totalRevenue = 0;
      let expiringThisWeek = 0;
      let totalDuration = 0;
      let totalBoosts = 0;

      boosts?.forEach((boost: any) => {
        const endDate = new Date(boost.end_date);
        const isActive = boost.is_active && endDate > now;

        if (isActive) {
          totalActiveBoosts++;
        }

        // Count revenue from all boosts (active or not)
        if (boost.boost_packages?.price) {
          totalRevenue += boost.boost_packages.price;
        }

        // Check if expiring this week
        if (isActive && endDate <= oneWeekFromNow) {
          expiringThisWeek++;
        }

        // Calculate average duration
        if (boost.boost_packages?.duration_days) {
          totalDuration += boost.boost_packages.duration_days;
          totalBoosts++;
        }
      });

      setStats({
        totalActiveBoosts,
        totalRevenue,
        expiringThisWeek,
        averageBoostDuration: totalBoosts > 0 ? Math.round(totalDuration / totalBoosts) : 0,
      });
    } catch (error) {
      console.error("Error fetching boost stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Boosts</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalActiveBoosts}</div>
          <p className="text-xs text-muted-foreground">
            Currently boosted items
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            From all boost packages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring This Week</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            Boosts ending soon
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageBoostDuration}</div>
          <p className="text-xs text-muted-foreground">
            Days per boost package
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
