import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';

describe('FloatingActionButton', () => {
  it('should render with default icon', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FloatingActionButton onPress={mockOnPress} />
    );

    expect(getByText('+')).toBeTruthy();
  });

  it('should render with custom icon', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FloatingActionButton onPress={mockOnPress} icon="✏️" />
    );

    expect(getByText('✏️')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <FloatingActionButton onPress={mockOnPress} />
    );

    fireEvent.press(getByText('+'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should have testID when provided', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <FloatingActionButton onPress={mockOnPress} testID="fab-button" />
    );

    expect(getByTestId('fab-button')).toBeTruthy();
  });
});
