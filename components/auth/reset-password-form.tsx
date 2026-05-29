"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Labels = {
  newPassword: string;
  confirmPassword: string;
  submit: string;
  submitting: string;
  mismatch: string;
  tooShort: string;
  successTitle: string;
  successDescription: string;
  errorInvalidLink: string;
  backToLogin: string;
  supabaseMissing: string;
};

export function ResetPasswordForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [ready, setReady]         = useState(false); // sessão de recovery activa
  const [invalidLink, setInvalid] = useState(false);
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!supabase) return;

    // Supabase processa automaticamente o hash da URL e emite PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Fallback: se já há sessão activa (utilizador autenticado via link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Timeout — se passados 5s não houver sessão, o link é inválido
    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setInvalid(true);
        return r;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError(labels.supabaseMissing); return; }
    if (password.length < 8) { setError(labels.tooShort); return; }
    if (password !== confirm) { setError(labels.mismatch); return; }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  // Link inválido / expirado
  if (invalidLink) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm text-slate-400">{labels.errorInvalidLink}</p>
        <Link href="/recuperar-password" className="inline-block text-sm text-amber-400 hover:underline">
          {labels.backToLogin}
        </Link>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <p className="font-medium text-slate-200">{labels.successTitle}</p>
          <p className="mt-1 text-sm text-slate-400">{labels.successDescription}</p>
        </div>
        <Link href="/login" className="inline-block text-sm text-amber-400 hover:underline">
          {labels.backToLogin}
        </Link>
      </div>
    );
  }

  // A aguardar sessão de recovery
  if (!ready) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
        A validar o link…
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative space-y-1">
        <Input
          type={showPw ? "text" : "password"}
          placeholder={labels.newPassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pr-10"
          disabled={loading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-2 text-slate-500 hover:text-slate-300"
          tabIndex={-1}
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-1">
        <Input
          type={showPw ? "text" : "password"}
          placeholder={labels.confirmPassword}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? labels.submitting : labels.submit}
      </Button>

      <div className="text-center">
        <Link href="/login" className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
          {labels.backToLogin}
        </Link>
      </div>
    </form>
  );
}
