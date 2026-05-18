"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabase";
import { addDays, format, subDays, parseISO, startOfDay } from "date-fns";

type UserChartData = {
  date: string;
  users: number;
  newUsers: number;
};

export function UserGrowthChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("30d");
  const [chartData, setChartData] = useState<UserChartData[]>([]);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
    fetchUserData();
  }, [isMobile, timeRange]);

  const fetchUserData = async () => {
    try {
      const today = new Date();
      let startDate: Date;

      // Determine the start date based on the selected time range
      switch (timeRange) {
        case "7d":
          startDate = subDays(today, 7);
          break;
        case "30d":
          startDate = subDays(today, 30);
          break;
        case "90d":
          startDate = subDays(today, 90);
          break;
        case "180d":
          startDate = subDays(today, 180);
          break;
        case "360d":
          startDate = subDays(today, 360);
          break;
        default:
          startDate = subDays(today, 30);
      }

      // Format dates for Supabase query
      const formattedStartDate = startOfDay(startDate).toISOString();
      const formattedEndDate = today.toISOString();

      // Get all users created within the date range
      const { data: userData, error } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", formattedStartDate)
        .lte("created_at", formattedEndDate)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      // Get total user count before the start date (for baseline)
      const { count: baselineCount, error: baselineError } = await supabase
        .from("users")
        .select("user_id", { count: "exact", head: true })
        .lt("created_at", formattedStartDate);

      if (baselineError) {
        console.error("Error fetching baseline count:", baselineError);
        return;
      }

      // Process the data to create daily counts
      const processedData: UserChartData[] = [];
      let totalUsers = baselineCount || 0;

      // Create a map to count users by date
      const usersByDate = new Map<string, number>();

      // Count users by date
      userData?.forEach((user) => {
        const date = format(parseISO(user.created_at), "yyyy-MM-dd");
        usersByDate.set(date, (usersByDate.get(date) || 0) + 1);
      });

      // Generate data for each day in the range
      let currentDate = startDate;
      while (currentDate <= today) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const newUsers = usersByDate.get(dateStr) || 0;
        totalUsers += newUsers;

        processedData.push({
          date: dateStr,
          users: totalUsers,
          newUsers: newUsers,
        });

        currentDate = addDays(currentDate, 1);
      }

      setChartData(processedData);
    } catch (error) {
      console.error("Error processing user data:", error);
    }
  };

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>User Growth</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total users and new registrations
          </span>
          <span className="@[540px]/card:hidden">User growth</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="360d" className="h-8 px-2.5">
              Last year
            </ToggleGroupItem>
            <ToggleGroupItem value="180d" className="h-8 px-2.5">
              Last 6 months
            </ToggleGroupItem>
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="360d" className="rounded-lg">
                Last year
              </SelectItem>
              <SelectItem value="180d" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="aspect-auto h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  return [
                    value,
                    name === "users" ? "Total Users" : "New Users",
                  ];
                }}
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Total Users"
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#colorNewUsers)"
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
