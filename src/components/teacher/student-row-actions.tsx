// components/teacher/student-row-actions.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Phone } from "lucide-react";

interface StudentRowActionsProps {
  studentName: string;
  email?: string;
  phone?: string;
}

export function StudentRowActions({
  studentName,
  email,
  phone,
}: StudentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-none">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu for {studentName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{studentName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {email && (
          <DropdownMenuItem asChild>
            <a href={`mailto:${email}`} className="cursor-pointer">
              <Mail className="mr-2 size-4" />
              Send email
            </a>
          </DropdownMenuItem>
        )}
        {phone && (
          <DropdownMenuItem asChild>
            <a href={`tel:${phone}`} className="cursor-pointer">
              <Phone className="mr-2 size-4" />
              Call
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
