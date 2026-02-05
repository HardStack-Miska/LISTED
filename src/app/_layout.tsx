import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ThemeProvider,
  useTheme,
  TaskProvider,
  AuthProvider,
  SyncProvider,
} from "@/contexts";

function RootLayoutContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider>
            <TaskProvider>
              <RootLayoutContent />
            </TaskProvider>
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
