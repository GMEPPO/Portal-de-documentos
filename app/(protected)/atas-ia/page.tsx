import { requireAuth } from "@/lib/auth";
import { AtasIaClient } from "./atas-ia-client";

export default async function AtasIaPage() {
  await requireAuth();
  return <AtasIaClient />;
}
