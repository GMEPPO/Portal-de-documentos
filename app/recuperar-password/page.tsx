import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecoverPasswordForm } from "@/components/auth/recover-password-form";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

export default function RecuperarPasswordPage() {
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{dictionary.recoverPassword.title}</CardTitle>
          <CardDescription>{dictionary.recoverPassword.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RecoverPasswordForm labels={dictionary.recoverPassword} />
        </CardContent>
      </Card>
    </div>
  );
}
