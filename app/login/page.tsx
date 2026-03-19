import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar na plataforma</CardTitle>
          <CardDescription>Ambiente interno de gestao documental.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">
            Autentica-te para aceder ao portal documental.
          </p>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
