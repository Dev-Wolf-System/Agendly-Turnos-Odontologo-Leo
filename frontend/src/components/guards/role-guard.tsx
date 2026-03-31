"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) return null;
  if (!user || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
