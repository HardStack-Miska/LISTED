import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoteCard } from '../../../components/ui/NoteCard';
import type { NoteListItem } from '../../../types/notes';

const mockNote: NoteListItem = {
  id: 'test-id-1',
  title: 'Test Note',
  preview: 'This is a test preview',
  icon: '📝',
  updatedAt: new Date(),
  hasChildren: false,
};

describe('NoteCard', () => {
  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render note title correctly', () => {
    const { getByText } = render(
      <NoteCard note={mockNote} onPress={mockOnPress} />
    );

    expect(getByText('Test Note')).toBeTruthy();
  });

  it('should render note preview correctly', () => {
    const { getByText } = render(
      <NoteCard note={mockNote} onPress={mockOnPress} />
    );

    expect(getByText('This is a test preview')).toBeTruthy();
  });

  it('should render note icon when provided', () => {
    const { getByText } = render(
      <NoteCard note={mockNote} onPress={mockOnPress} />
    );

    expect(getByText('📝')).toBeTruthy();
  });

  it('should call onPress with note id when pressed', () => {
    const { getByText } = render(
      <NoteCard note={mockNote} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Note'));
    expect(mockOnPress).toHaveBeenCalledWith('test-id-1');
  });

  it('should call onLongPress with note id when long pressed', () => {
    const { getByText } = render(
      <NoteCard
        note={mockNote}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
      />
    );

    fireEvent(getByText('Test Note'), 'longPress');
    expect(mockOnLongPress).toHaveBeenCalledWith('test-id-1');
  });

  it('should render "Без названия" when title is empty', () => {
    const noteWithoutTitle = { ...mockNote, title: '' };
    const { getByText } = render(
      <NoteCard note={noteWithoutTitle} onPress={mockOnPress} />
    );

    expect(getByText('Без названия')).toBeTruthy();
  });

  it('should show children indicator when note has children', () => {
    const noteWithChildren = { ...mockNote, hasChildren: true };
    const { getByText } = render(
      <NoteCard note={noteWithChildren} onPress={mockOnPress} />
    );

    expect(getByText('📄')).toBeTruthy();
  });

  it('should not show children indicator when note has no children', () => {
    const { queryByText } = render(
      <NoteCard note={mockNote} onPress={mockOnPress} />
    );

    expect(queryByText('📄')).toBeNull();
  });
});
