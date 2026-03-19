"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    if (!supabase) {
      setErrorMessage("Supabase nao esta configurado (variaveis em Vercel).");
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
          placeholder="Email"
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
          placeholder="Senha"
          type="password"
          {...form.register("password")}
          aria-invalid={Boolean(form.formState.errors.password)}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
        )}
      </div>

      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "A entrar..." : "Entrar"}
      </Button>
    </form>
  );
}

