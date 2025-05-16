"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Check, ChevronDown, Building } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useId, useState } from "react";

interface Company {
  value: string;
  label: string;
}

// This companies array is for demo; replace with your real data as needed
const companies: Company[] = [
  { value: "apple", label: "Apple Inc." },
  { value: "microsoft", label: "Microsoft Corporation" },
  { value: "google", label: "Google LLC" },
  { value: "amazon", label: "Amazon.com, Inc." },
  { value: "meta", label: "Meta Platforms, Inc." },
  { value: "netflix", label: "Netflix, Inc." },
  { value: "tesla", label: "Tesla, Inc." },
  { value: "ibm", label: "IBM Corporation" },
  { value: "oracle", label: "Oracle Corporation" },
  { value: "salesforce", label: "Salesforce, Inc." },
  { value: "adobe", label: "Adobe Inc." },
  { value: "intel", label: "Intel Corporation" },
];

interface CompanySearchProps {
  label?: string;
  placeholder?: string;
  className?: string;
  companies: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function CompanySearch({
  label = "Company",
  placeholder = "Search for a company...",
  className,
  companies,
  value,
  onChange,
}: CompanySearchProps) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");

  const selectedCompany = companies.find((company) => company.value === value);

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-3 py-5 h-10 font-normal shadow-sm bg-background hover:bg-muted/20 transition-colors duration-200 border-border/80 group relative overflow-hidden"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {selectedCompany?.label || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full opacity-70 hover:opacity-100 -mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                >
                  <span className="sr-only">Clear</span>
                  <span className="text-xs">×</span>
                </Button>
              )}
              <ChevronDown 
                size={16} 
                strokeWidth={2.5} 
                className="shrink-0 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200" 
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-border/80 p-0 shadow-lg bg-white" 
          align="start"
        >
          <Command>
            <div className="flex items-center border-b px-3 sticky top-0 z-10 backdrop-blur-sm bg-background/90">
              <Search 
                className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" 
                strokeWidth={2.5} 
              />
              <CommandInput 
                placeholder="Search company..." 
                className="h-10 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
                value={searchInput}
                onValueChange={setSearchInput}
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto p-1">
              <CommandEmpty className="py-6 text-center text-sm">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Building className="h-10 w-10 text-muted-foreground/30" />
                  <p>No company found</p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.value}
                    value={company.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchInput("");
                    }}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm flex items-center"
                  >
                    <div className="mr-2 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Building className="h-3 w-3" strokeWidth={2.5} />
                    </div>
                    <span>{company.label}</span>
                    {value === company.value && (
                      <Check 
                        size={16} 
                        strokeWidth={2.5} 
                        className="ml-auto text-primary" 
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 