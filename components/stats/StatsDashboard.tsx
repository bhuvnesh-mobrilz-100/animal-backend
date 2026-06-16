"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { StatsCard } from "./StatsCard"
import { UserGrowthChart } from "./UserGrowthChart"
import { BoostStats } from "./BoostStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Users, Building, Stethoscope, PawPrint, Zap } from "lucide-react"

// Define types for our data
type AnimalTypeData = {
  name: string
  value: number
  percentage: number
  id: number
}

type UserChartData = {
  date: string
  desktop: number
  mobile: number
}

type ServiceCategoryStats = {
  [key: string]: number
}

export function StatsDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    serviceProviders: {} as ServiceCategoryStats,
    totalServiceProviders: 0,
    animalTypes: [] as AnimalTypeData[],
    totalBreeds: 0,
    boostedEntities: {
      total: 0,
      byCategory: {} as ServiceCategoryStats
    }
  })
  const [loading, setLoading] = useState(true)
  const [userChartData, setUserChartData] = useState<UserChartData[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // Execute all queries in parallel for better performance
      const [
        usersResult,
        serviceProvidersResult,
        activeBoostedResult,
        animalTypesResult,
        breedsResult
      ] = await Promise.all([
        // Get users count
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false),

        // Get service providers with category info in one query
        supabase
          .from('service_providers')
          .select(`
            service_category_id,
            service_categories!inner(name),
            is_active,
            is_deleted
          `)
          .eq('is_active', true)
          .eq('is_deleted', false),

        // Get active boosts with service provider category info
        supabase
          .from('entity_boosts')
          .select(`
            service_provider_id,
            service_providers!inner(
              service_category_id,
              service_categories!inner(name)
            )
          `)
          .not('service_provider_id', 'is', null)
          .eq('is_active', true)
          .lt('start_date', new Date().toISOString())
          .gt('end_date', new Date().toISOString()),

        // Get animal types with breed counts and provider coverage in one efficient query
        supabase
          .from('animal_types')
          .select(`
            animal_type_id,
            name,
            breeds!breeds_animal_type_id_fkey(
              breed_id,
              service_provider_breeds!service_provider_breeds_breed_id_fkey(
                service_provider_id,
                service_providers!service_provider_breeds_service_provider_id_fkey(
                  is_active,
                  is_deleted
                )
              )
            )
          `),

        // Get total breeds count
        supabase
          .from('breeds')
          .select('*', { count: 'exact', head: true }),
      ])

      // Process service providers data
      const serviceProviderStats: ServiceCategoryStats = {}
      let totalServiceProviders = 0

      if (serviceProvidersResult.data) {
        serviceProvidersResult.data.forEach((provider: any) => {
          const categoryName = provider.service_categories?.name
          if (categoryName) {
            serviceProviderStats[categoryName] = (serviceProviderStats[categoryName] || 0) + 1
            totalServiceProviders++
          }
        })
      }

      // Process boost data
      const boostedByCategory: ServiceCategoryStats = {}
      let totalBoostedCount = 0

      if (activeBoostedResult.data) {
        activeBoostedResult.data.forEach((boost: any) => {
          const categoryName = boost.service_providers?.service_categories?.name
          if (categoryName) {
            boostedByCategory[categoryName] = (boostedByCategory[categoryName] || 0) + 1
            totalBoostedCount++
          }
        })
      }

      // Process animal types and breed distribution
      const animalTypesWithDistribution: AnimalTypeData[] = []
      if (animalTypesResult.data) {
        animalTypesResult.data.forEach((animalType: any) => {
          const totalBreeds = animalType.breeds?.length || 0
          
          // Get unique breeds that have active providers
          const breedsWithActiveProviders = new Set()
          
          animalType.breeds?.forEach((breed: any) => {
            const hasActiveBreeders = breed.service_provider_breeds?.some((spb: any) => 
              spb.service_providers?.is_active === true && 
              spb.service_providers?.is_deleted === false
            )
            
            if (hasActiveBreeders) {
              breedsWithActiveProviders.add(breed.breed_id)
            }
          })

          const breedsWithProvidersCount = breedsWithActiveProviders.size
          const percentage = totalBreeds > 0 ? (breedsWithProvidersCount / totalBreeds) * 100 : 0

          animalTypesWithDistribution.push({
            name: animalType.name,
            value: breedsWithProvidersCount,
            percentage: Math.round(percentage * 100) / 100,
            id: animalType.animal_type_id
          })
        })
      }

      setStats({
        users: usersResult.count || 0,
        serviceProviders: serviceProviderStats,
        totalServiceProviders,
        animalTypes: animalTypesWithDistribution,
        totalBreeds: breedsResult.count || 0,
        boostedEntities: {
          total: totalBoostedCount,
          byCategory: boostedByCategory
        }
      })

      // Generate mock data for user growth chart
      generateMockUserData()
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockUserData = () => {
    const today = new Date()
    const data: UserChartData[] = []
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Generate random values for desktop and mobile
      const desktop = Math.floor(Math.random() * 100) + 50
      const mobile = Math.floor(Math.random() * 150) + 100
      
      data.push({
        date: date.toISOString().split('T')[0],
        desktop,
        mobile
      })
    }
    
    setUserChartData(data)
  }

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Users" 
          value={stats.users} 
          icon={<Users className="h-4 w-4" />}
          change={{ value: 12.5, isPositive: true }}
          subtitle="active users"
        />
        <StatsCard 
          title="Service Providers" 
          value={stats.totalServiceProviders} 
          icon={<Building className="h-4 w-4" />}
          change={{ value: 8.2, isPositive: true }}
          subtitle="total providers"
        />
        <StatsCard 
          title="Veterinarians" 
          value={stats.serviceProviders['Veterinary Services'] || 0} 
          icon={<Stethoscope className="h-4 w-4" />}
          change={{ value: 5.7, isPositive: true }}
          subtitle="registered vets"
        />
        <StatsCard 
          title="Breeds" 
          value={stats.totalBreeds} 
          icon={<PawPrint className="h-4 w-4" />}
          subtitle="total breeds"
        />
      </div>

      {/* Boost Statistics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Boost Statistics</h2>
          <a 
            href="/dashboard/boosted" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Boosts →
          </a>
        </div>
        <BoostStats />
      </div>

      {/* Service Categories Bar Chart - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Service Categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution of service providers by category
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(stats.serviceProviders).map(([name, value]) => ({
                  name,
                  value,
                  percentage: stats.totalServiceProviders > 0 
                    ? Math.round((value / stats.totalServiceProviders) * 100 * 100) / 100 
                    : 0
                }))}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} providers (${props.payload.percentage}%)`, 
                    'Service Providers'
                  ]} 
                />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart />
        
        <Card>
          <CardHeader>
            <CardTitle>Animal Types Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of breeds by animal type
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.animalTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {stats.animalTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} breeds (${props.payload.percentage}%)`, 
                      'Breeds'
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.animalTypes.map((type, index) => (
                <div key={type.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{type.name}</span>
                  </div>
                  <span className="font-medium">
                    {type.percentage}% ({type.value} breeds)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
