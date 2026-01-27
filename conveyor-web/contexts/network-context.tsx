"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface NetworkContextType {
  online: boolean;
  retry: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateOnline = () => setOnline(navigator.onLine);
      setOnline(navigator.onLine);
      window.addEventListener("online", updateOnline);
      window.addEventListener("offline", updateOnline);
      return () => {
        window.removeEventListener("online", updateOnline);
        window.removeEventListener("offline", updateOnline);
      };
    }
  }, []);

  const retry = () => {
    if (typeof window !== "undefined") {
      setOnline(navigator.onLine);
    }
  };

  return (
    <NetworkContext.Provider value={{ online, retry }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
