import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getLocaleOptions } from "@/lib/i18n-shared";

export default function LoginPage() {
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex justify-end">
            <LanguageSwitcher
              currentLocale={locale}
              options={getLocaleOptions()}
              ariaLabel={dictionary.shell.languageLabel}
            />
          </div>
          <CardTitle>{dictionary.login.title}</CardTitle>
          <CardDescription>{dictionary.login.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">{dictionary.login.helper}</p>
          <LoginForm labels={dictionary.login} />
        </CardContent>
      </Card>
    </div>
  );
}
