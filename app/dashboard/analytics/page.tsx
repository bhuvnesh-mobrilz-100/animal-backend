"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Eye, Zap, Calendar, Search, Filter, Check, ChevronsUpDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Bar } from "recharts";
import { format, parseISO, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ServiceProvider {
  service_provider_id: number;
  name: string;
  category: {
    service_category_id: number;
    name: string;
    color?: string;
  };
}

interface ServiceCategory {
  service_category_id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
}

interface ViewData {
  date: string;
  views: number;
  isBoosted: boolean;
  boostStart?: string;
  boostEnd?: string;
}

interface BoostPeriod {
  start_date: string;
  end_date: string;
  package_name: string;
  is_active: boolean;
}

export default function AnalyticsPage() {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [viewData, setViewData] = useState<ViewData[]>([]);
  const [boostPeriods, setBoostPeriods] = useState<BoostPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("30"); // days
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchServiceProviders();
    fetchServiceCategories();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchAnalytics();
    }
  }, [selectedProvider, dateRange]);

  const fetchServiceProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          service_provider_id, 
          name,
          service_category:service_categories(
            service_category_id,
            name,
            color
          )
        `)
        .eq("is_deleted", false)
        .order("name");

      if (error) throw error;

      const providers: ServiceProvider[] = data?.map(p => ({
        service_provider_id: p.service_provider_id,
        name: p.name,
        category: p.service_category as any
      })) || [];

      setServiceProviders(providers);
      setFilteredProviders(providers);
    } catch (error) {
      console.error("Error fetching service providers:", error);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setServiceCategories(data || []);
    } catch (error) {
      console.error("Error fetching service categories:", error);
    }
  };

  // Filter providers based on category
  useEffect(() => {
    let filtered = serviceProviders;

    // Filter by service category
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(provider => 
        provider.category?.service_category_id === parseInt(selectedCategoryId)
      );
    }

    setFilteredProviders(filtered);
  }, [serviceProviders, selectedCategoryId]);

  const fetchAnalytics = async () => {
    if (!selectedProvider) return;
    
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch view logs
      const { data: viewLogs, error: viewError } = await supabase
        .from("view_logs")
        .select("viewed_at")
        .eq("service_provider_id", selectedProvider.service_provider_id)
        .gte("viewed_at", startDate.toISOString())
        .lte("viewed_at", endDate.toISOString())
        .order("viewed_at");

      if (viewError) throw viewError;

      // Fetch boost periods
      const { data: boosts, error: boostError } = await supabase
        .from("entity_boosts")
        .select(`
          start_date,
          end_date,
          is_active,
          boost_packages (
            name
          )
        `)
        .eq("service_provider_id", selectedProvider.service_provider_id)
        .order("start_date");

      if (boostError) throw boostError;

      // Process boost periods
      const processedBoosts: BoostPeriod[] = boosts?.map(boost => ({
        start_date: boost.start_date,
        end_date: boost.end_date,
        package_name: (boost.boost_packages as any)?.name || 'Unknown Package',
        is_active: boost.is_active
      })) || [];

      setBoostPeriods(processedBoosts);

      // Create daily view data
      const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyViews: { [key: string]: number } = {};

      // Count views per day
      viewLogs?.forEach(log => {
        const date = format(parseISO(log.viewed_at), 'yyyy-MM-dd');
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      });

      // Check if each day had active boosts
      const processedData: ViewData[] = dateInterval.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const views = dailyViews[dateStr] || 0;
        
        // Check if this date falls within any boost period
        const isBoosted = processedBoosts.some(boost => {
          const boostStart = parseISO(boost.start_date);
          const boostEnd = parseISO(boost.end_date);
          return date >= boostStart && date <= boostEnd && boost.is_active;
        });

        return {
          date: dateStr,
          views,
          isBoosted
        };
      });

      setViewData(processedData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = viewData.reduce((sum, day) => sum + day.views, 0);
  const boostedViews = viewData.filter(day => day.isBoosted).reduce((sum, day) => sum + day.views, 0);
  const nonBoostedViews = totalViews - boostedViews;
  const averageViews = viewData.length > 0 ? Math.round(totalViews / viewData.length) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{format(parseISO(label), 'MMM dd, yyyy')}</p>
          <p className="text-blue-600">
            Views: <span className="font-bold">{payload[0].value}</span>
          </p>
          {data.isBoosted && (
            <p className="text-amber-600 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Boosted Period
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Service Provider Analytics</h1>
        </div>
      </div>

      {/* Filtering and Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Service Category Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Service Category</label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {serviceCategories.map((category) => (
                <SelectItem key={category.service_category_id} value={category.service_category_id.toString()}>
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Provider Search Combobox */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Search Service Provider
            {filteredProviders.length > 0 && (
              <span className="text-muted-foreground ml-2">
                ({filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'})
              </span>
            )}
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedProvider ? (
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{selectedProvider.name}</span>
                    {selectedProvider.category?.color && (
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: selectedProvider.category.color }}
                      />
                    )}
                  </div>
                ) : (
                  "Search and select provider..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search service providers..." />
                <CommandList>
                  <CommandEmpty>No service providers found.</CommandEmpty>
                  <CommandGroup>
                    {filteredProviders.map((provider) => (
                      <CommandItem
                        key={provider.service_provider_id}
                        value={`${provider.name} ${provider.category?.name || ''}`}
                        onSelect={() => {
                          setSelectedProvider(provider);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProvider?.service_provider_id === provider.service_provider_id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{provider.name}</span>
                            {provider.category && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {provider.category.color && (
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: provider.category.color }}
                                  />
                                )}
                                <span>{provider.category.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProvider && (
        <>
          {/* Selected Provider Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedProvider.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Service Provider</Badge>
                    {selectedProvider.category && (
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: selectedProvider.category.color,
                          color: selectedProvider.category.color 
                        }}
                      >
                        {selectedProvider.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange} day period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boosted Views</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{boostedViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalViews > 0 ? Math.round((boostedViews / totalViews) * 100) : 0}% of total views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Views</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{nonBoostedViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalViews > 0 ? Math.round((nonBoostedViews / totalViews) * 100) : 0}% of total views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <Calendar className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{averageViews}</div>
                <p className="text-xs text-muted-foreground">
                  views per day
                </p>
              </CardContent>
            </Card>
          </div>

          {/* View Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                View Analytics for {selectedProvider.name}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Regular Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span>Boosted Period</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={viewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Background area for boosted periods */}
                      <Area
                        type="monotone"
                        dataKey={(data: ViewData) => data.isBoosted ? data.views : 0}
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#fef3c7"
                        fillOpacity={0.6}
                      />
                      
                      {/* Main line for all views */}
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Boost Periods */}
          {boostPeriods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Boost History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {boostPeriods.map((boost, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${boost.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <p className="font-medium">{boost.package_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(boost.start_date), 'MMM dd, yyyy')} - {format(parseISO(boost.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={boost.is_active ? "default" : "secondary"}>
                        {boost.is_active ? "Active" : "Expired"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedProvider && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Select a Service Provider</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Use the search combobox above to find and select a service provider to view detailed analytics and boost performance. 
              You can filter by category to narrow down your search.
            </p>
            {filteredProviders.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'} available
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
