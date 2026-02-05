import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import type { TextSpan, FormatType } from "@/types/editor";
import {
  applyFormat,
  getFormatsAtPosition,
  adjustSpansForTextChange,
} from "@/utils/textFormatting";

interface FormattedTextInputProps {
  value: string;
  spans?: TextSpan[];
  placeholder?: string;
  autoFocus?: boolean;
  onChangeText: (text: string, spans: TextSpan[]) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface FormatButton {
  type: FormatType;
  icon: keyof typeof Ionicons.glyphMap;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { type: "bold", icon: "text" },
  { type: "italic", icon: "text-outline" },
  { type: "underline", icon: "remove-outline" },
  { type: "code", icon: "code-slash" },
];

export const FormattedTextInput: React.FC<FormattedTextInputProps> = ({
  value,
  spans = [],
  placeholder,
  autoFocus = false,
  onChangeText,
  onSelectionChange,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [activeFormats, setActiveFormats] = useState<FormatType[]>([]);

  const inputRef = useRef<TextInput>(null);
  const toolbarOpacity = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(value);

  useEffect(() => {
    Animated.timing(toolbarOpacity, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused, toolbarOpacity]);

  useEffect(() => {
    const formats = getFormatsAtPosition(spans, selection.start);
    setActiveFormats(formats);
  }, [selection, spans]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { start, end } = e.nativeEvent.selection;
      setSelection({ start, end });
      onSelectionChange?.({ start, end });
    },
    [onSelectionChange],
  );

  const handleChangeText = useCallback(
    (newText: string) => {
      const oldText = previousValue.current;
      const oldLength = oldText.length;
      const newLength = newText.length;

      let changeStart = 0;
      while (
        changeStart < oldLength &&
        changeStart < newLength &&
        oldText[changeStart] === newText[changeStart]
      ) {
        changeStart++;
      }

      let oldEnd = oldLength;
      let newEnd = newLength;
      while (
        oldEnd > changeStart &&
        newEnd > changeStart &&
        oldText[oldEnd - 1] === newText[newEnd - 1]
      ) {
        oldEnd--;
        newEnd--;
      }

      const deletedLength = oldEnd - changeStart;
      const insertedLength = newEnd - changeStart;

      let adjustedSpans = spans;
      if (deletedLength > 0) {
        adjustedSpans = adjustSpansForTextChange(
          adjustedSpans,
          changeStart,
          deletedLength,
          false,
        );
      }
      if (insertedLength > 0) {
        adjustedSpans = adjustSpansForTextChange(
          adjustedSpans,
          changeStart,
          insertedLength,
          true,
        );
      }

      previousValue.current = newText;
      onChangeText(newText, adjustedSpans);
    },
    [spans, onChangeText],
  );

  const handleFormatPress = useCallback(
    (type: FormatType) => {
      const { start, end } = selection;

      if (start === end) {
        return;
      }

      const newSpans = applyFormat(spans, start, end, type);
      onChangeText(value, newSpans);
    },
    [selection, spans, value, onChangeText],
  );

  const isFormatActive = useCallback(
    (type: FormatType): boolean => {
      return activeFormats.includes(type);
    },
    [activeFormats],
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.toolbar,
          {
            opacity: toolbarOpacity,
            transform: [
              {
                translateY: toolbarOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isFocused ? "auto" : "none"}
      >
        {FORMAT_BUTTONS.map((button) => (
          <Pressable
            key={button.type}
            style={[
              styles.formatButton,
              isFormatActive(button.type) && styles.formatButtonActive,
            ]}
            onPress={() => handleFormatPress(button.type)}
          >
            <Ionicons
              name={button.icon}
              size={18}
              color={isFormatActive(button.type) ? COLORS.white : COLORS.text}
            />
          </Pressable>
        ))}
      </Animated.View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  formatButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  formatButtonActive: {
    backgroundColor: COLORS.primary,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
});
