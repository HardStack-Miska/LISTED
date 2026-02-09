import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import { networkService } from '@/services/network/NetworkService';

export const OfflineBanner: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isOffline, setIsOffline] = useState(!networkService.isConnected());
  const slideAnim = useRef(new Animated.Value(isOffline ? 0 : -50)).current;

  useEffect(() => {
    const unsubscribe = networkService.onConnectivityChange((connected) => {
      setIsOffline(!connected);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <Text style={styles.text}>Нет подключения к сети</Text>
    </Animated.View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      gap: SPACING.xs,
    },
    text: {
      fontSize: FONT_SIZES.sm,
      color: '#FFFFFF',
      fontWeight: '500',
    },
  });
