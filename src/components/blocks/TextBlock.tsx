import React, { useRef, useEffect, useCallback } from "react";
import {
  TextInput,
  StyleSheet,
  TextStyle,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { COLORS, SPACING } from "@/constants";

interface TextBlockProps {
  value: string;
  placeholder: string;
  style?: TextStyle;
  multiline?: boolean;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onEnterPress: () => void;
  onBackspaceEmpty: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  value,
  placeholder,
  style,
  multiline = true,
  autoFocus = false,
  onChangeText,
  onEnterPress,
  onBackspaceEmpty,
  onFocus,
  onBlur,
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key } = e.nativeEvent;

      if (key === "Enter") {
        onEnterPress();
      }

      if (key === "Backspace" && value === "") {
        onBackspaceEmpty();
      }
    },
    [value, onEnterPress, onBackspaceEmpty],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      // Обработка Enter в тексте (для Android)
      if (text.includes("\n") && !multiline) {
        const cleanText = text.replace(/\n/g, "");
        onChangeText(cleanText);
        onEnterPress();
        return;
      }
      onChangeText(text);
    },
    [onChangeText, onEnterPress, multiline],
  );

  return (
    <TextInput
      ref={inputRef}
      style={[styles.input, style]}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      multiline={multiline}
      blurOnSubmit={false}
      onChangeText={handleChangeText}
      onKeyPress={handleKeyPress}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
});
