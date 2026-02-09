import { PowerSyncDatabase } from '@powersync/react-native';
import { PowerSyncSchema } from './schema';
import { supabaseConnector } from './SupabaseConnector';

let powerSyncInstance: PowerSyncDatabase | null = null;

export const getPowerSyncDatabase = (): PowerSyncDatabase => {
  if (!powerSyncInstance) {
    powerSyncInstance = new PowerSyncDatabase({
      schema: PowerSyncSchema,
      database: {
        dbFilename: 'listed-sync.db',
      },
    });
  }
  return powerSyncInstance;
};

export const initializePowerSync = async (): Promise<void> => {
  const db = getPowerSyncDatabase();

  const powerSyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL;
  if (!powerSyncUrl) {
    await db.init();
    return;
  }

  await db.init();
  await db.connect(supabaseConnector);
};

export const disconnectPowerSync = async (): Promise<void> => {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnectAndClear();
  }
};

export const syncNow = async (): Promise<void> => {
  const db = getPowerSyncDatabase();
  if (!db.connected) {
    await db.connect(supabaseConnector);
  }
};
