import "@testing-library/jest-native/extend-expect";

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve()),
      getFirstAsync: jest.fn(() => Promise.resolve({ user_version: 1 })),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      withTransactionAsync: jest.fn((cb) => cb()),
    }),
  ),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: "Link",
  Stack: { Screen: "Screen" },
  Tabs: { Screen: "Screen" },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const createIconMock = (name) => {
    const IconMock = (props) =>
      React.createElement(
        Text,
        { testID: `icon-${name}`, ...props },
        props.name || name,
      );
    IconMock.displayName = name;
    return IconMock;
  };

  return {
    Ionicons: createIconMock("Ionicons"),
    MaterialIcons: createIconMock("MaterialIcons"),
    FontAwesome: createIconMock("FontAwesome"),
    Feather: createIconMock("Feather"),
  };
});

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Swipeable: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
    PanGestureHandler: "PanGestureHandler",
    TapGestureHandler: "TapGestureHandler",
    State: {},
    Directions: {},
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "undetermined" }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("mock-id")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: "high" },
}));

// Mock all contexts to avoid deep dependency chains (supabase, netinfo, powersync)
const MOCK_COLORS = {
  primary: "#dc4c3e",
  primaryLight: "#fce4e2",
  secondary: "#808080",
  background: "#ffffff",
  surface: "#fafafa",
  text: "#202020",
  textSecondary: "#808080",
  border: "#f0f0f0",
  error: "#dc4c3e",
  danger: "#f44336",
  success: "#058527",
  warning: "#ff9900",
  white: "#ffffff",
  priorityP1: "#d1453b",
  priorityP2: "#eb8909",
  priorityP3: "#246fe0",
  priorityP4: "#808080",
  card: "#ffffff",
};

jest.mock("@/contexts", () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    mode: "light",
    isDark: false,
    colors: MOCK_COLORS,
    setMode: jest.fn(),
  }),
  useColors: () => MOCK_COLORS,
  TaskProvider: ({ children }) => children,
  useTaskContext: () => ({
    allTasks: [],
    isLoading: false,
    refresh: jest.fn(),
    toggleComplete: jest.fn(),
    deleteTask: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    getTodayTasks: () => [],
  }),
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
  SyncProvider: ({ children }) => children,
  useSync: () => ({
    isSyncing: false,
    syncNow: jest.fn(),
  }),
}));
