import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{dictionary.resetPassword.title}</CardTitle>
          <CardDescription>{dictionary.resetPassword.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm labels={dictionary.resetPassword} />
        </CardContent>
      </Card>
    </div>
  );
}
