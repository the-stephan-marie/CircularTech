import type { ReactNode } from "react";
import { AppChrome } from "@/components/AppChrome";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AppChrome>{children}</AppChrome>;
}
