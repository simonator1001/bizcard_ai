"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Check, ChevronDown } from "lucide-react";
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

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background px-3 py-2 font-normal shadow-sm outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>{
              value ? companies.find((company) => company.value === value)?.label : placeholder
            }</span>
            <ChevronDown size={16} strokeWidth={2} className="shrink-0 text-muted-foreground/80" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0 shadow-md bg-white" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <CommandInput 
                placeholder="Search company..." 
                className="h-10 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto p-1 bg-white">
              <CommandEmpty>No company found.</CommandEmpty>
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.value}
                    value={company.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-md px-2 py-1.5 text-sm"
                  >
                    {company.label}
                    {value === company.value && (
                      <Check size={16} strokeWidth={2} className="ml-auto" />
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