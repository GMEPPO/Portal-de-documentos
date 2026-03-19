import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
            Este scaffold vem com autenticacao de desenvolvimento ativa.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">Continuar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
