import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: Загрузить данные заметки по id
  // TODO: Реализовать редактор (US-002)

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>
        Редактор заметки {id}
      </Text>
      <Text style={styles.hint}>
        Будет реализован в US-002
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  placeholder: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});
