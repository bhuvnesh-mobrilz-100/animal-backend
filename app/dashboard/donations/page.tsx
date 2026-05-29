"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type RescueCentreOption = { rescue_centre_id: number; name: string };
type DonationCampaign = {
  campaign_id: number;
  rescue_centre_id: number;
  title: string;
  description?: string | null;
  monthly_target: number;
  visible: boolean;
  expires_at?: string | null;
  rescue_centres?: { name?: string | null } | null;
};

const emptyForm = {
  rescue_centre_id: "",
  title: "",
  description: "",
  monthly_target: "",
  visible: true,
  expires_at: "",
};

export default function DonationsPage() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [rescueCentres, setRescueCentres] = useState<RescueCentreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DonationCampaign | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isEditing = useMemo(() => Boolean(selected), [selected]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [campaignRes, rescueRes] = await Promise.all([
        fetch("/api/v1/donations"),
        fetch("/api/v1/rescue-centres"),
      ]);

      const campaignJson = await campaignRes.json();
      const rescueJson = await rescueRes.json();
      setCampaigns(campaignJson.campaigns || []);
      setRescueCentres(rescueJson.rescueCentres || []);
    } catch (error) {
      console.error("Error loading donations page:", error);
      toast.error("Failed to load donation data");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(campaign: DonationCampaign) {
    setSelected(campaign);
    setForm({
      rescue_centre_id: String(campaign.rescue_centre_id || ""),
      title: campaign.title || "",
      description: campaign.description || "",
      monthly_target: String(campaign.monthly_target ?? ""),
      visible: Boolean(campaign.visible),
      expires_at: campaign.expires_at ? String(campaign.expires_at).slice(0, 10) : "",
    });
    setFormOpen(true);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        rescue_centre_id: Number(form.rescue_centre_id),
        title: form.title,
        description: form.description,
        monthly_target: Number(form.monthly_target),
        visible: form.visible,
        expires_at: form.expires_at || null,
      };

      const response = await fetch(
        selected ? `/api/v1/donations?campaign_id=${selected.campaign_id}` : "/api/v1/donations",
        {
          method: selected ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selected ? payload : payload),
        }
      );

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to save campaign");

      toast.success(selected ? "Campaign updated" : "Campaign created");
      setFormOpen(false);
      setSelected(null);
      setForm(emptyForm);
      loadData();
    } catch (error: any) {
      console.error("Error saving donation campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/donations?campaign_id=${selected.campaign_id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to delete campaign");
      toast.success("Campaign deleted");
      setDeleteOpen(false);
      setSelected(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting donation campaign:", error);
      toast.error(error.message || "Failed to delete campaign");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-muted-foreground">Create and manage donation campaigns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Campaign
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No campaigns yet</CardTitle>
            <CardDescription>Create the first campaign using the button above.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.campaign_id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription>
                      {campaign.rescue_centres?.name || "Unknown rescue centre"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(campaign)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelected(campaign);
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
                <div>{campaign.description || "No description"}</div>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Target: {campaign.monthly_target}</span>
                  <span>Status: {campaign.visible ? "Visible" : "Hidden"}</span>
                  <span>Expires: {campaign.expires_at ? new Date(campaign.expires_at).toLocaleDateString() : "No expiry"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Campaign" : "Add Campaign"}</DialogTitle>
            <DialogDescription>
              Fill in the donation campaign details and save changes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rescue_centre_id">Rescue Centre</Label>
              <select
                id="rescue_centre_id"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.rescue_centre_id}
                onChange={(e) => setForm((prev) => ({ ...prev, rescue_centre_id: e.target.value }))}
                required
              >
                <option value="">Select rescue centre</option>
                {rescueCentres.map((centre) => (
                  <option key={centre.rescue_centre_id} value={centre.rescue_centre_id}>
                    {centre.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly_target">Monthly Target</Label>
                <Input id="monthly_target" type="number" min="0" value={form.monthly_target} onChange={(e) => setForm((prev) => ({ ...prev, monthly_target: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At</Label>
                <Input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="visible">Visible</Label>
                <p className="text-sm text-muted-foreground">Show this campaign to the public.</p>
              </div>
              <Switch id="visible" checked={form.visible} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, visible: checked }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected donation campaign.
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
