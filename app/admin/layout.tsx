import { requireAdminAccess } from "@/lib/auth";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireAdminAccess();

  return <AdminLayoutShell role={role}>{children}</AdminLayoutShell>;
}
