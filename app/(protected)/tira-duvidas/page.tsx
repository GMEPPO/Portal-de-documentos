import { requireAuth } from "@/lib/auth";
import { TiraDuvidasClient } from "./tira-duvidas-client";

export default async function TiraDuvidasPage() {
  const user = await requireAuth();
  return <TiraDuvidasClient user={user} />;
}
