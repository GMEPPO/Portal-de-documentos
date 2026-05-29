"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Labels = {
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDescription: string;
  backToLogin: string;
  supabaseMissing: string;
  emailInvalid: string;
};

export function RecoverPasswordForm({ labels }: { labels: Labels }) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError(labels.emailInvalid);
      return;
    }
    if (!supabase) {
      setError(labels.supabaseMissing);
      return;
    }

    setLoading(true);
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    // Sempre mostrar sucesso — não revelar se o email existe
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <p className="font-medium text-slate-200">{labels.successTitle}</p>
          <p className="mt-1 text-sm text-slate-400">{labels.successDescription}</p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-amber-400 hover:underline"
        >
          {labels.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <Input
          type="email"
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9"
          required
          disabled={loading}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? labels.submitting : labels.submit}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
        >
          {labels.backToLogin}
        </Link>
      </div>
    </form>
  );
}
