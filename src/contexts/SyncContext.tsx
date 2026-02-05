import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { PowerSyncDatabase } from "@powersync/react-native";
import {
  getPowerSyncDatabase,
  initializePowerSync,
  disconnectPowerSync,
  supabaseConnector,
} from "@/services/powersync";
import { networkService } from "@/services/network";
import { useAuth } from "./AuthContext";

type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface SyncContextType {
  db: PowerSyncDatabase | null;
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
  const { isAuthenticated, user } = useAuth();
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSyncEnabled =
    isAuthenticated && Boolean(process.env.EXPO_PUBLIC_POWERSYNC_URL);

  // Initialize PowerSync database
  useEffect(() => {
    const init = async () => {
      try {
        const powerSyncDb = getPowerSyncDatabase();
        await powerSyncDb.init();
        setDb(powerSyncDb);
      } catch (err) {
        console.error("Failed to initialize PowerSync:", err);
        setError("Failed to initialize database");
      }
    };
    init();
  }, []);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (!db) return;

    const connect = async () => {
      if (isAuthenticated && isSyncEnabled && isOnline) {
        try {
          setStatus("syncing");
          await db.connect(supabaseConnector);
          setStatus("synced");
          setLastSyncedAt(new Date());
          setError(null);
        } catch (err) {
          console.error("Sync connection error:", err);
          setStatus("error");
          setError(err instanceof Error ? err.message : "Sync failed");
        }
      } else if (!isAuthenticated && db.connected) {
        await db.disconnect();
        setStatus("idle");
      }
    };

    connect();
  }, [db, isAuthenticated, isSyncEnabled, isOnline]);

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

  // Watch for sync status changes
  useEffect(() => {
    if (!db) return;

    const updateStatus = db.registerListener({
      statusChanged: (newStatus) => {
        const dataFlow = newStatus.dataFlowStatus;
        const isDownloading = dataFlow?.downloading ?? false;
        const isUploading = dataFlow?.uploading ?? false;

        if (newStatus.connected && !isDownloading && !isUploading) {
          setStatus("synced");
          if (newStatus.lastSyncedAt) {
            setLastSyncedAt(newStatus.lastSyncedAt);
          }
        } else if (isDownloading || isUploading) {
          setStatus("syncing");
        }
      },
    });

    return () => {
      updateStatus();
    };
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!db || !isSyncEnabled || !isOnline) {
      return;
    }

    try {
      setStatus("syncing");
      if (!db.connected) {
        await db.connect(supabaseConnector);
      }
      setStatus("synced");
      setLastSyncedAt(new Date());
      setError(null);
    } catch (err) {
      console.error("Manual sync error:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }, [db, isSyncEnabled, isOnline]);

  return (
    <SyncContext.Provider
      value={{
        db,
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
