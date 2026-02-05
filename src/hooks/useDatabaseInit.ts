import { useEffect, useState } from 'react';
import { databaseService } from '@/services/database';

interface UseDatabaseInitResult {
  isReady: boolean;
  error: Error | null;
}

export const useDatabaseInit = (): UseDatabaseInitResult => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await databaseService.initDatabase();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Database init failed'));
      }
    };

    init();
  }, []);

  return { isReady, error };
};
