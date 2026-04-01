import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  ...props
}: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Value />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  ...props
}: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "z-50 rounded-md border border-slate-700 bg-slate-800 p-1 text-slate-100 shadow-xl",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{props.children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  ...props
}: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "cursor-pointer rounded-sm px-3 py-2 text-sm text-slate-100 outline-none hover:bg-slate-700 focus:bg-slate-700",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText />
    </SelectPrimitive.Item>
  );
}
