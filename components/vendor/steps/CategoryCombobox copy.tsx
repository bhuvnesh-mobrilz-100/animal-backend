import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function CategoryCombobox({ sections, vendor, updateVendor }: any) {
  const [open, setOpen] = useState(false);

  // Flatten the categories to find the selected one
  const allCategories = sections
    ?.map((section: any) => section.categories)
    .reduce((acc: any[], curr: any[]) => acc.concat(curr), []);
  const selectedCategory = allCategories?.find(
    (c: any) => c.category_id === vendor.category
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategory ? selectedCategory.name : "Select a category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-60 overflow-y-auto">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandEmpty>No category found.</CommandEmpty>

          {sections?.map((section: any) => (
            <CommandGroup key={section.name} heading={section.name}>
              {section.categories.map((category: any) => (
                <CommandItem
                  key={category.category_id}
                  value={`${section.name.toLowerCase()}-${category.name.toLowerCase()}`}
                  onSelect={() => {
                    updateVendor({ category: category.category_id });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      category.category_id === vendor.category
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
