"use client";

import { useEffect, useState } from "react";
import type { ToastItem } from "@/components/ui/toast";

let listeners: ((toast: ToastItem) => void)[] = [];

export function pushToast(toast: ToastItem) {
  listeners.forEach((listener) => listener(toast));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (toast: ToastItem) => {
      setItems((prev) => [...prev, toast]);
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== toast.id));
      }, 2600);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((item) => item !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-slate-700 bg-slate-800 p-3 text-sm">
          <p className="font-semibold">{item.title}</p>
          {item.description && <p className="text-slate-300">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
