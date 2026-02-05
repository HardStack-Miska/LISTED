import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PriorityPicker } from '@/components/tasks/PriorityPicker';

describe('PriorityPicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all priority options', () => {
    const { getByText } = render(
      <PriorityPicker value={4} onChange={mockOnChange} />
    );

    expect(getByText('P1')).toBeTruthy();
    expect(getByText('P2')).toBeTruthy();
    expect(getByText('P3')).toBeTruthy();
    expect(getByText('P4')).toBeTruthy();
  });

  it('should render label', () => {
    const { getByText } = render(
      <PriorityPicker value={4} onChange={mockOnChange} />
    );

    expect(getByText('Приоритет')).toBeTruthy();
  });

  it('should call onChange when priority is selected', () => {
    const { getByText } = render(
      <PriorityPicker value={4} onChange={mockOnChange} />
    );

    fireEvent.press(getByText('P1'));
    expect(mockOnChange).toHaveBeenCalledWith(1);

    fireEvent.press(getByText('P2'));
    expect(mockOnChange).toHaveBeenCalledWith(2);

    fireEvent.press(getByText('P3'));
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('should highlight selected priority', () => {
    const { getByText, rerender } = render(
      <PriorityPicker value={1} onChange={mockOnChange} />
    );

    // P1 should be selected
    const p1 = getByText('P1');
    expect(p1.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontWeight: '600' }),
      ])
    );

    // Change to P3
    rerender(<PriorityPicker value={3} onChange={mockOnChange} />);
    const p3 = getByText('P3');
    expect(p3.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontWeight: '600' }),
      ])
    );
  });
});
