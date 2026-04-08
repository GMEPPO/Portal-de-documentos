import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

export default function UnauthorizedPage() {
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{dictionary.unauthorized.title}</CardTitle>
          <CardDescription>{dictionary.unauthorized.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">{dictionary.unauthorized.action}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
