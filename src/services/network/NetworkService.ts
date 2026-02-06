import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

type ConnectivityCallback = (isConnected: boolean) => void;

class NetworkService {
  private static instance: NetworkService;
  private isConnectedState = true;
  private listeners: Set<ConnectivityCallback> = new Set();
  private unsubscribe: NetInfoSubscription | null = null;

  private constructor() {}

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  async initialize(): Promise<void> {
    const state = await NetInfo.fetch();
    this.isConnectedState = state.isConnected ?? true;

    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newConnected = state.isConnected ?? true;
      if (newConnected !== this.isConnectedState) {
        this.isConnectedState = newConnected;
        this.notifyListeners(newConnected);
      }
    });
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }

  onConnectivityChange(callback: ConnectivityCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach((callback) => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
}

export const networkService = NetworkService.getInstance();
