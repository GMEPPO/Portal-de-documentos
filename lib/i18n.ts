import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n-shared";

export function getLocale() {
  const cookieStore = cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}
export { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n-shared";
