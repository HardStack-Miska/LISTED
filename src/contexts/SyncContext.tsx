import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { networkService } from "@/services/network";
import { supabaseService } from "@/services/supabase/SupabaseClient";
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
  isExpoGo: boolean;
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
  const [syncInitialized, setSyncInitialized] = useState(false);

  // Detect Expo Go vs native build
  const isExpoGo = Constants.appOwnership === "expo";

  // Check if Supabase backend is configured
  const supabaseConfigured = useMemo(
    () => supabaseService.isConfigured(),
    [],
  );

  // Sync is enabled only in native builds with auth and Supabase configured
  const isSyncEnabled =
    !isExpoGo && isAuthenticated && supabaseConfigured;

  // Monitor network status
  useEffect(() => {
    networkService.initialize();
    setIsOnline(networkService.isConnected());

    const unsubscribe = networkService.onConnectivityChange((connected) => {
      setIsOnline(connected);
      if (!connected) {
        setStatus((prev) =>
          prev !== "disabled" ? "offline" : prev,
        );
      } else if (isSyncEnabled && syncInitialized) {
        // Re-sync when connectivity is restored
        setStatus("syncing");
        initSync().catch((err) => console.error('Failed to re-sync:', err));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isSyncEnabled, syncInitialized]);

  // Initialize PowerSync when sync becomes enabled
  useEffect(() => {
    if (isSyncEnabled && !syncInitialized) {
      initSync();
    } else if (!isSyncEnabled) {
      setStatus("disabled");
      setSyncInitialized(false);
    }
  }, [isSyncEnabled]);

  const initSync = async () => {
    try {
      setStatus("syncing");
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { initializePowerSync } = require("@/services/powersync/PowerSyncDatabase");
      await initializePowerSync();

      setSyncInitialized(true);
      setStatus("synced");
      setLastSyncedAt(new Date());
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось подключиться к синхронизации",
      );
    }
  };

  const syncNow = useCallback(async () => {
    if (!isSyncEnabled || !syncInitialized) return;

    try {
      setStatus("syncing");
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { syncNow: performSync } = require("@/services/powersync/PowerSyncDatabase");
      await performSync();

      setStatus("synced");
      setLastSyncedAt(new Date());
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Ошибка синхронизации",
      );
    }
  }, [isSyncEnabled, syncInitialized]);

  return (
    <SyncContext.Provider
      value={{
        status,
        lastSyncedAt,
        isOnline,
        isSyncEnabled,
        isExpoGo,
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
