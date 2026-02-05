import React, { useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { NoteList } from '@/components/ui/NoteList';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useNotes } from '@/hooks/useNotes';
import { COLORS } from '@/constants';

export default function NotesScreen() {
  const router = useRouter();
  const { notes, isLoading, isRefreshing, refresh, deleteNote } = useNotes();

  const handleNotePress = useCallback(
    (id: string) => {
      router.push(`/notes/${id}`);
    },
    [router]
  );

  const handleNoteLongPress = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;

      Alert.alert(note.title, 'Выберите действие', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteNote(id),
        },
      ]);
    },
    [notes, deleteNote]
  );

  const handleCreateNote = useCallback(() => {
    // TODO: Создать новую заметку и перейти к редактированию
    router.push('/notes/new');
  }, [router]);

  return (
    <View style={styles.container}>
      <NoteList
        notes={notes}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onNotePress={handleNotePress}
        onNoteLongPress={handleNoteLongPress}
        onRefresh={refresh}
        onCreateNote={handleCreateNote}
      />
      <FloatingActionButton onPress={handleCreateNote} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
