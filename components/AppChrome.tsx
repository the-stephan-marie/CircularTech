import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <PageHeader />
        {children}
      </main>
    </>
  );
}
