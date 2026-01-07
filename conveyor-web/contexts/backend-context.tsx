"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { monitoringApi, SystemHealth } from "@/lib/api/monitoring";

interface BackendContextType {
  healthy: boolean;
  checking: boolean;
  retry: () => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [healthy, setHealthy] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const healthList: SystemHealth[] = await monitoringApi.getCurrentHealth();
      // Consider healthy if all services are healthy, or at least one is healthy
      const isHealthy =
        healthList.length > 0 &&
        healthList.every((h) => h.status === "healthy");
      setHealthy(isHealthy);
    } catch {
      setHealthy(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <BackendContext.Provider value={{ healthy, checking, retry: checkHealth }}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
};
