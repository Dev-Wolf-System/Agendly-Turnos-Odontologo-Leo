"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SubscriptionBanner } from "@/components/layout/subscription-banner";
import { HealthLoader } from "@/components/ui/health-loader";
import { ChatWidget } from "@/components/layout/chat-widget";
import { ZoeWidget } from "@/components/layout/zoe-widget";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeatureFlagContext, useFeatureFlagProvider } from "@/hooks/useFeatureFlags";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const featureFlagValue = useFeatureFlagProvider();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
    if (!isLoading && user?.role === "superadmin") {
      router.replace("/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <HealthLoader />;
  }

  if (!user || user.role === "superadmin") return null;

  return (
    <FeatureFlagContext.Provider value={featureFlagValue}>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <div className="relative z-10 shrink-0">
              <Header />
              <SubscriptionBanner />
            </div>
            <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
          </div>
        </div>
        <ChatWidget />
        <ZoeWidget />
      </SidebarProvider>
    </FeatureFlagContext.Provider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
