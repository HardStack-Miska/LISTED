import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../../components/ui/EmptyState';

describe('EmptyState', () => {
  it('should render title correctly', () => {
    const { getByText } = render(
      <EmptyState title="Нет заметок" description="Создайте первую заметку" />
    );

    expect(getByText('Нет заметок')).toBeTruthy();
  });

  it('should render description correctly', () => {
    const { getByText } = render(
      <EmptyState title="Нет заметок" description="Создайте первую заметку" />
    );

    expect(getByText('Создайте первую заметку')).toBeTruthy();
  });

  it('should render action button when actionLabel and onAction provided', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Нет заметок"
        description="Создайте первую заметку"
        actionLabel="Создать"
        onAction={mockOnAction}
      />
    );

    expect(getByText('Создать')).toBeTruthy();
  });

  it('should not render action button when actionLabel is missing', () => {
    const mockOnAction = jest.fn();
    const { queryByText } = render(
      <EmptyState
        title="Нет заметок"
        description="Создайте первую заметку"
        onAction={mockOnAction}
      />
    );

    expect(queryByText('Создать')).toBeNull();
  });

  it('should call onAction when action button is pressed', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Нет заметок"
        description="Создайте первую заметку"
        actionLabel="Создать"
        onAction={mockOnAction}
      />
    );

    fireEvent.press(getByText('Создать'));
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('should render emoji icon', () => {
    const { getByText } = render(
      <EmptyState title="Нет заметок" description="Создайте первую заметку" />
    );

    expect(getByText('📝')).toBeTruthy();
  });
});
