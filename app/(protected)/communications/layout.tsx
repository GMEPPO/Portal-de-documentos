import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { canManageCommunications } from "@/lib/rbac";

export default async function CommunicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  if (!canManageCommunications(user.role)) {
    redirect("/unauthorized");
  }
  return <>{children}</>;
}
