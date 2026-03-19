"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        router.push("/login");
        router.refresh();
      }}
    >
      Sair
    </Button>
  );
}

