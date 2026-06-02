"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type RescueCentre = {
  rescue_centre_id: number;
  name: string;
  description?: string | null;
  address: string;
  phone?: string | null;
  website?: string | null;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = {
  name: "",
  description: "",
  address: "",
  phone: "",
  website: "",
  is_verified: false,
};

export default function RescueCentresPage() {
  const [centres, setCentres] = useState<RescueCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<RescueCentre | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isEditing = useMemo(() => Boolean(selected), [selected]);

  useEffect(() => {
    loadCentres();
  }, []);

  async function loadCentres() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rescue_centres")
        .select("*")
        .order("name");

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error("Error loading rescue centres:", error);
      toast.error("Failed to load rescue centres");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(centre: RescueCentre) {
    setSelected(centre);
    setForm({
      name: centre.name || "",
      description: centre.description || "",
      address: centre.address || "",
      phone: centre.phone || "",
      website: centre.website || "",
      is_verified: Boolean(centre.is_verified),
    });
    setFormOpen(true);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (isEditing && selected) {
        // Update existing rescue centre
        const { error } = await supabase
          .from("rescue_centres")
          .update({
            name: form.name,
            description: form.description || null,
            address: form.address,
            phone: form.phone || null,
            website: form.website || null,
            is_verified: form.is_verified,
            updated_at: new Date().toISOString(),
          })
          .eq("rescue_centre_id", selected.rescue_centre_id);

        if (error) throw error;
        toast.success("Rescue centre updated");
      } else {
        // Create new rescue centre
        const { error } = await supabase
          .from("rescue_centres")
          .insert([{
            name: form.name,
            description: form.description || null,
            address: form.address,
            phone: form.phone || null,
            website: form.website || null,
            is_verified: form.is_verified,
          }]);

        if (error) throw error;
        toast.success("Rescue centre created");
      }

      setFormOpen(false);
      setSelected(null);
      setForm(emptyForm);
      loadCentres();
    } catch (error: any) {
      console.error("Error saving rescue centre:", error);
      toast.error(error.message || "Failed to save rescue centre");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("rescue_centres")
        .delete()
        .eq("rescue_centre_id", selected.rescue_centre_id);

      if (error) throw error;
      
      toast.success("Rescue centre deleted");
      setDeleteOpen(false);
      setSelected(null);
      loadCentres();
    } catch (error: any) {
      console.error("Error deleting rescue centre:", error);
      toast.error(error.message || "Failed to delete rescue centre");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rescue Centres</h1>
          <p className="text-muted-foreground">Create and manage rescue centres.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCentres} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Centre
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : centres.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No rescue centres yet</CardTitle>
            <CardDescription>Create the first rescue centre using the button above.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {centres.map((centre) => (
            <Card key={centre.rescue_centre_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{centre.name}</CardTitle>
                    <CardDescription>{centre.address}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(centre)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelected(centre);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>{centre.description || "No description"}</div>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Phone: {centre.phone || "—"}</span>
                  <span>Website: {centre.website || "—"}</span>
                  <span>Status: {centre.is_verified ? "Verified" : "Unverified"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Rescue Centre" : "Add Rescue Centre"}</DialogTitle>
            <DialogDescription>
              Fill in the rescue centre details and save changes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <PlacesAutocomplete
                value={form.address}
                onChange={(address: string) => setForm((prev) => ({ ...prev, address }))}
                label=""
                placeholder="Search for an address..."
                description="Search an address to fetch the formatted location from Google Maps."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="verified">Verified</Label>
                <p className="text-sm text-muted-foreground">Mark the rescue centre as verified.</p>
              </div>
              <Switch id="verified" checked={form.is_verified} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_verified: checked }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Centre"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rescue centre?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected rescue centre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-destructive text-destructive-foreground">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}