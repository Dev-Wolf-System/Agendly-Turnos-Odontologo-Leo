"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import clinicaService, { type FeatureFlags } from "@/services/clinica.service";

interface FeatureFlagContextValue {
  features: FeatureFlags;
  loading: boolean;
  isEnabled: (key: string) => boolean;
  refresh: () => Promise<void>;
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  features: {},
  loading: true,
  isEnabled: () => false,
  refresh: async () => {},
});

export function useFeatureFlagProvider(): FeatureFlagContextValue {
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await clinicaService.getFeatures();
      setFeatures(data);
    } catch {
      setFeatures({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (key: string) => features[key] === true,
    [features],
  );

  return { features, loading, isEnabled, refresh };
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

export function useFeatureFlag(key: string): { enabled: boolean; loading: boolean } {
  const { isEnabled, loading } = useFeatureFlags();
  return { enabled: isEnabled(key), loading };
}
