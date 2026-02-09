import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { Snackbar } from '@/components/ui/Snackbar';

interface SnackbarOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, options?: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLabel, setActionLabel] = useState<string | undefined>();
  const [onAction, setOnAction] = useState<(() => void) | undefined>();
  const [duration, setDuration] = useState(5000);

  const showSnackbar = useCallback(
    (msg: string, options?: SnackbarOptions) => {
      setMessage(msg);
      setActionLabel(options?.actionLabel);
      setOnAction(() => options?.onAction);
      setDuration(options?.duration ?? 5000);
      setVisible(true);
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={visible}
        message={message}
        actionLabel={actionLabel}
        onAction={onAction}
        onDismiss={handleDismiss}
        duration={duration}
      />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
