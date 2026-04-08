"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AdminFormSubmitButton({
  label,
  pendingLabel,
  variant = "default",
  className,
  disabled = false,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={disabled || pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
