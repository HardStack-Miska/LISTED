import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Snackbar } from '@/components/ui/Snackbar';

describe('Snackbar', () => {
  const mockOnDismiss = jest.fn();
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const renderSnackbar = (props = {}) => {
    return render(
      <Snackbar
        visible={true}
        message="Test message"
        onDismiss={mockOnDismiss}
        {...props}
      />,
    );
  };

  describe('rendering', () => {
    it('should render message when visible', () => {
      const { getByText } = renderSnackbar();
      expect(getByText('Test message')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderSnackbar({ visible: false });
      expect(queryByText('Test message')).toBeNull();
    });

    it('should render action button when provided', () => {
      const { getByText } = renderSnackbar({
        actionLabel: 'Отменить',
        onAction: mockOnAction,
      });
      // textTransform: 'uppercase' does not apply in test env
      expect(getByText('Отменить')).toBeTruthy();
    });

    it('should not render action button when not provided', () => {
      const { queryByText } = renderSnackbar();
      expect(queryByText('Отменить')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('should call onAction and onDismiss when action button pressed', () => {
      const { getByText } = renderSnackbar({
        actionLabel: 'Отменить',
        onAction: mockOnAction,
      });

      fireEvent.press(getByText('Отменить'));

      expect(mockOnAction).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after duration', () => {
      jest.useFakeTimers();

      renderSnackbar({ duration: 3000 });

      expect(mockOnDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss when duration is 0', () => {
      jest.useFakeTimers();

      renderSnackbar({ duration: 0 });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      jest.useFakeTimers();

      const { unmount } = renderSnackbar({ duration: 3000 });

      unmount();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});
