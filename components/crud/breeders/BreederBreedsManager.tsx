"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Breed {
  breed_id: number;
  name: string;
  animal_type: {
    name: string;
  };
}

interface BreederBreed {
  breeder_breed_id: number;
  breed_id: number;
  breed: Breed;
}

interface BreederBreedsManagerProps {
  breederId: number;
  breederName: string;
}

export function BreederBreedsManager({ breederId, breederName }: BreederBreedsManagerProps) {
  const [breederBreeds, setBreederBreeds] = useState<BreederBreed[]>([]);
  const [availableBreeds, setAvailableBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBreederBreeds();
    fetchAvailableBreeds();
  }, [breederId]);

  const fetchBreederBreeds = async () => {
    try {
      const { data, error } = await supabase
        .from("breeder_breeds")
        .select(`
          breeder_breed_id,
          breed_id,
          breeds!inner(
            breed_id,
            name,
            animal_types!inner(name)
          )
        `)
        .eq("breeder_id", breederId);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        breeder_breed_id: item.breeder_breed_id,
        breed_id: item.breed_id,
        breed: {
          breed_id: item.breeds.breed_id,
          name: item.breeds.name,
          animal_type: {
            name: item.breeds.animal_types.name
          }
        }
      }));
      
      setBreederBreeds(transformedData);
    } catch (error) {
      console.error("Error fetching breeder breeds:", error);
      toast.error("Failed to load breeder breeds");
    }
  };

  const fetchAvailableBreeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("breeds")
        .select(`
          breed_id,
          name,
          animal_types!inner(name)
        `)
        .order("name");

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        breed_id: item.breed_id,
        name: item.name,
        animal_type: {
          name: item.animal_types.name
        }
      }));
      
      setAvailableBreeds(transformedData);
    } catch (error) {
      console.error("Error fetching available breeds:", error);
      toast.error("Failed to load available breeds");
    } finally {
      setLoading(false);
    }
  };

  const addBreedToBreeder = async (breedId: number) => {
    // Check if breed is already assigned
    if (breederBreeds.some(bb => bb.breed_id === breedId)) {
      toast.error("This breed is already assigned to the breeder");
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from("breeder_breeds")
        .insert({
          breeder_id: breederId,
          breed_id: breedId
        });

      if (error) throw error;

      toast.success("Breed added successfully");
      fetchBreederBreeds(); // Refresh the list
      setCommandOpen(false);
    } catch (error) {
      console.error("Error adding breed:", error);
      toast.error("Failed to add breed");
    } finally {
      setAdding(false);
    }
  };

  const removeBreedFromBreeder = async (breederBreedId: number) => {
    try {
      const { error } = await supabase
        .from("breeder_breeds")
        .delete()
        .eq("breeder_breed_id", breederBreedId);

      if (error) throw error;

      toast.success("Breed removed successfully");
      setBreederBreeds(breederBreeds.filter(bb => bb.breeder_breed_id !== breederBreedId));
    } catch (error) {
      console.error("Error removing breed:", error);
      toast.error("Failed to remove breed");
    }
  };

  // Filter out breeds that are already assigned
  const unassignedBreeds = availableBreeds.filter(
    breed => !breederBreeds.some(bb => bb.breed_id === breed.breed_id)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Breeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Breeds for {breederName}</span>
          <Popover open={commandOpen} onOpenChange={setCommandOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" disabled={adding}>
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Breed
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Command>
                <CommandInput placeholder="Search breeds..." />
                <CommandList>
                  <CommandEmpty>No breeds found.</CommandEmpty>
                  <CommandGroup>
                    {unassignedBreeds.map((breed) => (
                      <CommandItem
                        key={breed.breed_id}
                        onSelect={() => addBreedToBreeder(breed.breed_id)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{breed.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {breed.animal_type.name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {breederBreeds.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No breeds assigned to this breeder yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {breederBreeds.map((breederBreed) => (
              <Badge
                key={breederBreed.breeder_breed_id}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{breederBreed.breed.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {breederBreed.breed.animal_type.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeBreedFromBreeder(breederBreed.breeder_breed_id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {breederBreed.breed.name}</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
