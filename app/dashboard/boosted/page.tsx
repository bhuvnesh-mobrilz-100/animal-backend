"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Search, Trash2, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

type EntityType = "vet" | "breeder" | "pet_friendly_place" | "service_provider";

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
  users: {
    user_name: string;
    email: string;
  };
  vets?: { name: string };
  breeders?: { name: string };
  pet_friendly_places?: { name: string };
  service_providers?: { name: string };
}

interface BoostPackage {
  boost_package_id: number;
  name: string;
  duration_days: number;
  description: string;
  price: number;
}

interface EntityOption {
  id: number;
  name: string;
  type: EntityType;
}

interface BoostFormState {
  entity_type: EntityType | "";
  entity_id: string;
  package_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const emptyForm: BoostFormState = {
  entity_type: "",
  entity_id: "",
  package_id: "",
  user_id: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

const entityTypeLabels: Record<EntityType, string> = {
  vet: "Veterinarian",
  breeder: "Breeder",
  pet_friendly_place: "Pet Friendly Place",
  service_provider: "Service Provider",
};

export default function BoostedPage() {
  const [boosts, setBoosts] = useState<EntityBoost[]>([]);
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBoost, setEditingBoost] = useState<EntityBoost | null>(null);
  const [deletingBoost, setDeletingBoost] = useState<EntityBoost | null>(null);
  const [form, setForm] = useState<BoostFormState>(emptyForm);

  const { toast } = useToast();

  useEffect(() => {
    fetchBoosts();
    fetchPackages();
    fetchEntities();
  }, []);

  const fetchBoosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("entity_boosts")
        .select(`
          *,
          boost_packages (
            name,
            duration_days,
            price,
            description
          ),
          users (
            user_name,
            email
          ),
          vets (
            name
          ),
          breeders (
            name
          ),
          pet_friendly_places (
            name
          ),
          service_providers (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBoosts(data || []);
    } catch (error) {
      console.error("Error fetching boosts:", error);
      toast({ title: "Error", description: "Failed to fetch boosted items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from("boost_packages").select("*").order("price");
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

      const allEntities: EntityOption[] = [
        ...(vets.data?.map((item) => ({ id: item.vet_id, name: item.name, type: "vet" as const })) || []),
        ...(breeders.data?.map((item) => ({ id: item.breeder_id, name: item.name, type: "breeder" as const })) || []),
        ...(petFriendlyPlaces.data?.map((item) => ({ id: item.pet_friendly_place_id, name: item.name, type: "pet_friendly_place" as const })) || []),
        ...(serviceProviders.data?.map((item) => ({ id: item.service_provider_id, name: item.name, type: "service_provider" as const })) || []),
      ];

      setEntities(allEntities);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const getEntityName = (boost: EntityBoost) => boost.vets?.name || boost.breeders?.name || boost.pet_friendly_places?.name || boost.service_providers?.name || "Unknown Entity";

  const getEntityType = (boost: EntityBoost) => {
    if (boost.vet_id) return "Veterinarian";
    if (boost.breeder_id) return "Breeder";
    if (boost.pet_friendly_place_id) return "Pet Friendly Place";
    if (boost.service_provider_id) return "Service Provider";
    return "Unknown";
  };

  const filteredBoosts = boosts.filter((boost) => {
    const matchesSearch =
      getEntityName(boost).toLowerCase().includes(searchTerm.toLowerCase()) ||
      boost?.users?.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boost?.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && boost.is_active && !isExpired(boost.end_date)) ||
      (filterStatus === "expired" && (isExpired(boost.end_date) || !boost.is_active));

    return matchesSearch && matchesFilter;
  });

  const filteredEntitiesByType = useMemo(
    () => entities.filter((entity) => (form.entity_type ? entity.type === form.entity_type : false)),
    [entities, form.entity_type]
  );

  const openCreateDialog = () => {
    setEditingBoost(null);
    setForm(emptyForm);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (boost: EntityBoost) => {
    const boostEntityType = boost.vet_id
      ? "vet"
      : boost.breeder_id
        ? "breeder"
        : boost.pet_friendly_place_id
          ? "pet_friendly_place"
          : boost.service_provider_id
            ? "service_provider"
            : "";

    const entityId = boost.vet_id || boost.breeder_id || boost.pet_friendly_place_id || boost.service_provider_id || "";

    setEditingBoost(boost);
    setForm({
      entity_type: boostEntityType,
      entity_id: entityId ? String(entityId) : "",
      package_id: String(boost.package_id || ""),
      user_id: String(boost.user_id || ""),
      start_date: boost.start_date ? String(boost.start_date).slice(0, 16) : "",
      end_date: boost.end_date ? String(boost.end_date).slice(0, 16) : "",
      is_active: Boolean(boost.is_active),
    });
    setIsFormDialogOpen(true);
  };

  const resetForm = () => {
    setIsFormDialogOpen(false);
    setEditingBoost(null);
    setForm(emptyForm);
  };

  const submitBoost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.entity_type || !form.entity_id || !form.package_id || !form.user_id) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        boost_package_id: Number(form.package_id),
        entity_type: form.entity_type,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      };

      payload[`${form.entity_type}_id`] = Number(form.entity_id);

      const response = await fetch(
        editingBoost ? `/api/v1/boosted?entity_boost_id=${editingBoost.entity_boost_id}` : "/api/v1/boosted",
        {
          method: editingBoost ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to save boost");

      if (editingBoost && form.is_active !== editingBoost.is_active) {
        await supabase.from("entity_boosts").update({ is_active: form.is_active }).eq("entity_boost_id", editingBoost.entity_boost_id);
      }

      toast({ title: "Success", description: editingBoost ? "Boost updated successfully" : "Boost created successfully" });
      resetForm();
      fetchBoosts();
    } catch (error) {
      console.error("Error saving boost:", error);
      toast({ title: "Error", description: "Failed to save boost", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleBoostStatus = async (boostId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("entity_boosts").update({ is_active: !currentStatus }).eq("entity_boost_id", boostId);
      if (error) throw error;

      toast({ title: "Success", description: `Boost ${!currentStatus ? "activated" : "deactivated"} successfully` });
      fetchBoosts();
    } catch (error) {
      console.error("Error updating boost status:", error);
      toast({ title: "Error", description: "Failed to update boost status", variant: "destructive" });
    }
  };

  const deleteBoost = async (boostId: number) => {
    try {
      const { error } = await supabase.from("entity_boosts").delete().eq("entity_boost_id", boostId);
      if (error) throw error;

      toast({ title: "Success", description: "Boost deleted successfully" });
      fetchBoosts();
    } catch (error) {
      console.error("Error deleting boost:", error);
      toast({ title: "Error", description: "Failed to delete boost", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Boosted Items</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchBoosts()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Boost
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search boosted items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
        </div>
        <Select value={filterStatus} onValueChange={(value: "all" | "active" | "expired") => setFilterStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter boosts" />
          </SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all">All Boosts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBoosts.map((boost) => (
          <Card key={boost.entity_boost_id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{getEntityName(boost)}</CardTitle>
                <p className="text-xs text-muted-foreground">{getEntityType(boost)}</p>
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(boost)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleBoostStatus(boost.entity_boost_id, boost.is_active)}>
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
                      <AlertDialogAction onClick={() => deleteBoost(boost.entity_boost_id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{getEntityType(boost)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium">{boost.boost_packages.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{boost.boost_packages.duration_days} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">R{boost.boost_packages.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span>{boost?.users?.user_name || boost?.users?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={boost.is_active && !isExpired(boost.end_date) ? "default" : "secondary"}>
                    {boost.is_active && !isExpired(boost.end_date) ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>{format(new Date(boost.end_date), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBoosts.length === 0 && (
        <div className="py-8 text-center">
          <Zap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium text-muted-foreground">No boosted items found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterStatus !== "all" ? "Try adjusting your search or filters" : "Create your first boost to get started"}
          </p>
        </div>
      )}

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => (open ? setIsFormDialogOpen(true) : resetForm())}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingBoost ? "Edit Boost" : "Create New Boost"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitBoost} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="entity_type">Entity Type</Label>
              <Select
                value={form.entity_type}
                onValueChange={(value: EntityType) => setForm((prev) => ({ ...prev, entity_type: value, entity_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
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
                value={form.entity_id}
                onValueChange={(value) => setForm((prev) => ({ ...prev, entity_id: value }))}
                disabled={!form.entity_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
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
              <Select value={form.package_id} onValueChange={(value) => setForm((prev) => ({ ...prev, package_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.boost_package_id} value={pkg.boost_package_id.toString()}>
                      {pkg.name} - {pkg.duration_days} days - R{pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input id="user_id" value={form.user_id} onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))} placeholder="Enter user ID" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="datetime-local" value={form.start_date} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="datetime-local" value={form.end_date} onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">Control whether this boost is active.</p>
              </div>
              <Switch id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBoost ? "Save Changes" : "Create Boost"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}