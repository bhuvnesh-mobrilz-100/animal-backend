"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Search, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BoostUser {
  user_id: number;
  user_name: string;
  email: string;
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface EntityBoost {
  entity_boost_id: number;
  vet_id: number | null;
  breeder_id: number | null;
  pet_friendly_place_id: number | null;
  service_provider_id: number | null;
  user_id: number;
  package_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  boost_packages: {
    name: string;
    duration_days: number;
    price: number;
    description: string;
  };
  users?: {
    user_name: string;
    email: string;
  } | null;
  vets?: {
    name: string;
  };
  breeders?: {
    name: string;
  };
  pet_friendly_places?: {
    name: string;
  };
  service_providers?: {
    name: string;
  };
}

interface BoostPackage {
  boost_package_id: number;
  name: string;
  duration_days: number;
  description: string;
  price: number;
}

interface Entity {
  id: number;
  name: string;
  type: 'vet' | 'breeder' | 'pet_friendly_place' | 'service_provider';
}

export default function BoostedPage() {
  const [boosts, setBoosts] = useState<EntityBoost[]>([]);
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoost, setNewBoost] = useState({
    entity_type: "",
    entity_id: "",
    package_id: "",
    user_id: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchBoosts();
    fetchPackages();
    fetchEntities();
  }, []);

  const fetchBoosts = async () => {
    try {
      const { data: boostData, error: boostError } = await supabase
        .from("entity_boosts")
        .select(`
          *,
          boost_packages (
            name,
            duration_days,
            price,
            description
          )
        `)
        .order("created_at", { ascending: false });

      if (boostError) throw boostError;

      const boostsWithUsers = (boostData || []) as EntityBoost[];
      const userIds = Array.from(
        new Set(boostsWithUsers.map((boost) => boost.user_id).filter(Boolean))
      );

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("user_id, user_name, email")
          .in("user_id", userIds);

        if (usersError) throw usersError;

        const usersMap = new Map<number, BoostUser>();
        (usersData || []).forEach((user: BoostUser) => {
          usersMap.set(user.user_id, user);
        });

        setBoosts(
          boostsWithUsers.map((boost) => ({
            ...boost,
            users: usersMap.get(boost.user_id) || null,
          }))
        );
      } else {
        setBoosts(boostsWithUsers);
      }
    } catch (error) {
      console.error("Error fetching boosts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch boosted items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("boost_packages")
        .select("*")
        .order("price");

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const fetchEntities = async () => {
    try {
      const [vets, breeders, petFriendlyPlaces, serviceProviders] = await Promise.all([
        supabase.from("vets").select("vet_id, name").eq("is_deleted", false),
        supabase.from("breeders").select("breeder_id, name").eq("is_deleted", false),
        supabase.from("pet_friendly_places").select("pet_friendly_place_id, name").eq("is_deleted", false),
        supabase.from("service_providers").select("service_provider_id, name").eq("is_deleted", false),
      ]);

      const allEntities: Entity[] = [
        ...(vets.data?.map(v => ({ id: v.vet_id, name: v.name, type: 'vet' as const })) || []),
        ...(breeders.data?.map(b => ({ id: b.breeder_id, name: b.name, type: 'breeder' as const })) || []),
        ...(petFriendlyPlaces.data?.map(p => ({ id: p.pet_friendly_place_id, name: p.name, type: 'pet_friendly_place' as const })) || []),
        ...(serviceProviders.data?.map(s => ({ id: s.service_provider_id, name: s.name, type: 'service_provider' as const })) || []),
      ];

      setEntities(allEntities);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const createBoost = async () => {
    if (!newBoost.entity_type || !newBoost.entity_id || !newBoost.package_id || !newBoost.user_id) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedPackage = packages.find(p => p.boost_package_id.toString() === newBoost.package_id);
      if (!selectedPackage) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + selectedPackage.duration_days);

      const boostData: any = {
        user_id: parseInt(newBoost.user_id),
        package_id: parseInt(newBoost.package_id),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      };

      // Set the appropriate entity ID
      const entityIdKey = `${newBoost.entity_type}_id`;
      boostData[entityIdKey] = parseInt(newBoost.entity_id);

      const { error } = await supabase
        .from("entity_boosts")
        .insert([boostData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Boost created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewBoost({
        entity_type: "",
        entity_id: "",
        package_id: "",
        user_id: "",
      });
      fetchBoosts();
    } catch (error) {
      console.error("Error creating boost:", error);
      toast({
        title: "Error",
        description: "Failed to create boost",
        variant: "destructive",
      });
    }
  };

  const toggleBoostStatus = async (boostId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("entity_boosts")
        .update({ is_active: !currentStatus })
        .eq("entity_boost_id", boostId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Boost ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchBoosts();
    } catch (error) {
      console.error("Error updating boost status:", error);
      toast({
        title: "Error",
        description: "Failed to update boost status",
        variant: "destructive",
      });
    }
  };

  const deleteBoost = async (boostId: number) => {
    try {
      const { error } = await supabase
        .from("entity_boosts")
        .delete()
        .eq("entity_boost_id", boostId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Boost deleted successfully",
      });

      fetchBoosts();
    } catch (error) {
      console.error("Error deleting boost:", error);
      toast({
        title: "Error",
        description: "Failed to delete boost",
        variant: "destructive",
      });
    }
  };

  const getEntityName = (boost: EntityBoost) => {
    const entity = entities.find((entity) => {
      return (
        (boost.vet_id && entity.type === "vet" && entity.id === boost.vet_id) ||
        (boost.breeder_id && entity.type === "breeder" && entity.id === boost.breeder_id) ||
        (boost.pet_friendly_place_id && entity.type === "pet_friendly_place" && entity.id === boost.pet_friendly_place_id) ||
        (boost.service_provider_id && entity.type === "service_provider" && entity.id === boost.service_provider_id)
      );
    });

    if (entity) return entity.name;

    if (boost.vets) return boost.vets.name;
    if (boost.breeders) return boost.breeders.name;
    if (boost.pet_friendly_places) return boost.pet_friendly_places.name;
    if (boost.service_providers) return boost.service_providers.name;

    return "Unknown Entity";
  };

  const getEntityType = (boost: EntityBoost) => {
    if (boost.vet_id) return "Veterinarian";
    if (boost.breeder_id) return "Breeder";
    if (boost.pet_friendly_place_id) return "Pet Friendly Place";
    if (boost.service_provider_id) return "Service Provider";
    return "Unknown";
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const filteredBoosts = boosts.filter(boost => {
    const matchesSearch = getEntityName(boost).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boost?.users?.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boost?.users?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && boost.is_active && !isExpired(boost.end_date)) ||
                         (filterStatus === "expired" && (isExpired(boost.end_date) || !boost.is_active));

    return matchesSearch && matchesFilter;
  });

  const filteredEntitiesByType = entities.filter(entity => 
    newBoost.entity_type ? entity.type === newBoost.entity_type : false
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Boosted Items</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Boost
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Boost</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select
                  value={newBoost.entity_type}
                  onValueChange={(value) => setNewBoost({ ...newBoost, entity_type: value, entity_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vet">Veterinarian</SelectItem>
                    <SelectItem value="breeder">Breeder</SelectItem>
                    <SelectItem value="pet_friendly_place">Pet Friendly Place</SelectItem>
                    <SelectItem value="service_provider">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="entity_id">Entity</Label>
                <Select
                  value={newBoost.entity_id}
                  onValueChange={(value) => setNewBoost({ ...newBoost, entity_id: value })}
                  disabled={!newBoost.entity_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEntitiesByType.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="package_id">Boost Package</Label>
                <Select
                  value={newBoost.package_id}
                  onValueChange={(value) => setNewBoost({ ...newBoost, package_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.boost_package_id} value={pkg.boost_package_id.toString()}>
                        {pkg.name} - {pkg.duration_days} days - R{pkg.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createBoost}>
                  Create Boost
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search boosted items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boosts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boosts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBoosts.map((boost) => (
          <Card key={boost.entity_boost_id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getEntityName(boost)}
              </CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBoostStatus(boost.entity_boost_id, boost.is_active)}
                >
                  {boost.is_active ? "Deactivate" : "Activate"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Boost</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this boost? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBoost(boost.entity_boost_id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline">{getEntityType(boost)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Package:</span>
                  <span className="text-sm font-medium">{boost.boost_packages.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm">{boost.boost_packages.duration_days} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-sm font-medium">R{boost.boost_packages.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="text-sm">{boost?.users?.user_name || boost?.users?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge 
                    variant={boost.is_active && !isExpired(boost.end_date) ? "default" : "secondary"}
                  >
                    {boost.is_active && !isExpired(boost.end_date) ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires:</span>
                  <span className="text-sm">
                    {format(new Date(boost.end_date), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBoosts.length === 0 && (
        <div className="text-center py-8">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No boosted items found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterStatus !== "all" 
              ? "Try adjusting your search or filters" 
              : "Create your first boost to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
