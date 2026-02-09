import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';
import { getSupabaseClient } from '../supabase';

// Supabase table names match PowerSync schema
const TABLES = ['tasks', 'projects', 'labels', 'task_labels', 'reminders'];

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    const powerSyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL;
    if (!powerSyncUrl) {
      throw new Error('PowerSync URL not configured');
    }

    return {
      endpoint: powerSyncUrl,
      token: sessionData.session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      for (const operation of transaction.crud) {
        await this.processOperation(operation, client);
      }
      await transaction.complete();
    } catch (error) {
      console.error('Sync upload failed:', error);
      throw error;
    }
  }

  private async processOperation(
    operation: CrudEntry,
    client: ReturnType<typeof getSupabaseClient>,
  ): Promise<void> {
    if (!client) return;

    const table = operation.table;
    if (!TABLES.includes(table)) {
      return;
    }

    const { id, ...data } = operation.opData ?? {};

    switch (operation.op) {
      case UpdateType.PUT:
        // Upsert: insert or update
        const { error: upsertError } = await client
          .from(table)
          .upsert({ id: operation.id, ...data });
        if (upsertError) throw upsertError;
        break;

      case UpdateType.PATCH:
        // Update existing record
        const { error: updateError } = await client
          .from(table)
          .update(data)
          .eq('id', operation.id);
        if (updateError) throw updateError;
        break;

      case UpdateType.DELETE:
        // Delete record
        const { error: deleteError } = await client
          .from(table)
          .delete()
          .eq('id', operation.id);
        if (deleteError) throw deleteError;
        break;
    }
  }
}

export const supabaseConnector = new SupabaseConnector();
