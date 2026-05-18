"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Breeder } from "./schema";
import { columns } from "./columns";
import { DataTable } from "../DataTable";
import { BreederForm } from "./BreederForm";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BreedersCrud() {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBreeder, setSelectedBreeder] = useState<Breeder | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBreeders();
  }, []);

  const fetchBreeders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("breeders")
        .select(
          `
          *,
          location:locations(*)
        `
        )
        .eq("is_deleted", false)
        .order("name");

      if (error) throw error;
      setBreeders(data || []);
    } catch (error) {
      console.error("Error fetching breeders:", error);
      toast.error("Failed to load breeders");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBreeder = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditBreeder = (breeder: Breeder) => {
    setSelectedBreeder(breeder);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBreeder = (breeder: Breeder) => {
    setSelectedBreeder(breeder);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBreeder = async () => {
    if (!selectedBreeder) return;

    try {
      const { error } = await supabase
        .from("breeders")
        .update({ is_deleted: true })
        .eq("breeder_id", selectedBreeder.breeder_id);

      if (error) throw error;

      // Update the local state to remove the deleted breeder
      setBreeders(
        breeders.filter((b) => b.breeder_id !== selectedBreeder.breeder_id)
      );
      toast.success("Breeder deleted successfully");
    } catch (error) {
      console.error("Error deleting breeder:", error);
      toast.error("Failed to delete breeder");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBreeder(null);
    }
  };

  // Enhanced columns with edit and delete actions
  const enhancedColumns = [
    ...columns,
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
        const breeder = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/dashboard/breeders/${breeder.breeder_id}`);
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/dashboard/breeders/${breeder.breeder_id}#breeds`);
                }}
              >
                Manage breeds
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditBreeder(breeder)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteBreeder(breeder)} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Breeders Management</h2>
        <Button onClick={handleAddBreeder}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Breeder
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={breeders}
          filterKey="name"
          filterPlaceholder="Filter breeders..."
          // onAdd={handleAddBreeder}
        />
      )}

      {/* Add Breeder Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Breeder</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new breeder.
            </DialogDescription>
          </DialogHeader>
          <BreederForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchBreeders();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* Edit Breeder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ScrollableDialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Breeder</DialogTitle>
            <DialogDescription>Update the breeder details.</DialogDescription>
          </DialogHeader>
          {selectedBreeder && (
            <BreederForm
              breeder={selectedBreeder}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedBreeder(null);
                fetchBreeders();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedBreeder(null);
              }}
            />
          )}
        </ScrollableDialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the breeder as deleted. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBreeder(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBreeder}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
