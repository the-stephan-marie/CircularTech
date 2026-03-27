"use client";

import { usePathname } from "next/navigation";
import { DashboardDemoControls } from "@/components/DashboardDemoControls";

const headers: Record<
  string,
  { title: string; subtitle?: string }
> = {
  "/dashboard": { title: "Waste Management System" },
  "/users": {
    title: "User Management",
    subtitle: "Manage staff users and collectors.",
  },
  "/data": {
    title: "Data Management",
    subtitle: "Review validated and pending waste submissions.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure your workspace preferences.",
  },
};

export function PageHeader() {
  const pathname = usePathname();
  const meta = headers[pathname] ?? headers["/dashboard"];

  const showDemoControls = pathname === "/dashboard";

  return (
    <header
      className="sticky top-0 z-40 bg-surface-container-lowest/80 px-8 py-5 shadow-[0_1px_0_rgba(190,202,187,0.12)] backdrop-blur-[12px]"
      id="page-header"
    >
      <div
        className={
          showDemoControls
            ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            : "flex flex-col gap-1"
        }
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface md:text-2xl">
            {meta.title}
          </h2>
          {meta.subtitle ? (
            <p className="mt-1 text-sm text-on-surface-variant">{meta.subtitle}</p>
          ) : null}
        </div>
        {showDemoControls ? (
          <div className="shrink-0 sm:pt-0.5">
            <DashboardDemoControls />
          </div>
        ) : null}
      </div>
    </header>
  );
}
