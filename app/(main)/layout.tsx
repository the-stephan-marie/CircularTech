import type { ReactNode } from "react";
import { AppChrome } from "@/components/AppChrome";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <AppChrome>{children}</AppChrome>
    </AdminAuthGuard>
  );
}
