"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginInput = {
  email: string;
  password: string;
};

export function LoginForm({
  labels,
}: {
  labels: {
    emailInvalid: string;
    passwordInvalid: string;
    supabaseMissing: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    forgotPassword: string;
  };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(
      z.object({
        email: z.string().email(labels.emailInvalid),
        password: z.string().min(8, labels.passwordInvalid),
      }),
    ),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    if (!supabase) {
      setErrorMessage(labels.supabaseMissing);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <Input
          placeholder={labels.emailPlaceholder}
          type="email"
          {...form.register("email")}
          aria-invalid={Boolean(form.formState.errors.email)}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Input
          placeholder={labels.passwordPlaceholder}
          type="password"
          {...form.register("password")}
          aria-invalid={Boolean(form.formState.errors.password)}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
        )}
        <div className="flex justify-end pt-0.5">
          <Link
            href="/recuperar-password"
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
          >
            {labels.forgotPassword}
          </Link>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
