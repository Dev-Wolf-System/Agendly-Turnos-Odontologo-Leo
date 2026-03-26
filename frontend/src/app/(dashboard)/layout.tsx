"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { HealthLoader } from "@/components/ui/health-loader";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <HealthLoader />;
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="relative z-10 shrink-0">
            <Header />
          </div>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
