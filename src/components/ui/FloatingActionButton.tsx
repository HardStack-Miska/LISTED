import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, UI_SIZES } from "@/constants";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = "+",
  testID,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: UI_SIZES.fabSize,
    height: UI_SIZES.fabSize,
    borderRadius: UI_SIZES.fabRadius,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: "300",
  },
});
