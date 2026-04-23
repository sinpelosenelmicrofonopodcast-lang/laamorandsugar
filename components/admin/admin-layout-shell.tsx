"use client";

import { usePathname } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";

export function AdminLayoutShell({
  children,
  role
}: {
  children: React.ReactNode;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AdminSidebar pathname={pathname} />
        <div className="space-y-6">
          <div className="glass-panel flex flex-col gap-4 rounded-[2rem] border border-white/70 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
                Admin panel
              </p>
              <h1 className="font-serif text-4xl text-foreground">
                Bakery operations, content, and fulfillment
              </h1>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                Sign out ({role})
              </Button>
            </form>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
