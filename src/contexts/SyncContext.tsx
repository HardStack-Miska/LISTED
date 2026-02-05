import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { networkService } from "@/services/network";
import { useAuth } from "./AuthContext";

type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "error"
  | "offline"
  | "disabled";

interface SyncContextType {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  isSyncEnabled: boolean;
  syncNow: () => Promise<void>;
  error: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("disabled");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PowerSync requires native build - disabled for Expo Go
  // Will be enabled when building with EAS Build
  const isSyncEnabled = false;

  // Monitor network status
  useEffect(() => {
    networkService.initialize();
    setIsOnline(networkService.isConnected());

    const unsubscribe = networkService.onConnectivityChange((connected) => {
      setIsOnline(connected);
      if (!connected) {
        setStatus("offline");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = useCallback(async () => {
    // PowerSync sync disabled in Expo Go
    // Will work after EAS Build with native modules
    console.log("Sync requires native build (EAS Build)");
  }, []);

  return (
    <SyncContext.Provider
      value={{
        status,
        lastSyncedAt,
        isOnline,
        isSyncEnabled,
        syncNow,
        error,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
