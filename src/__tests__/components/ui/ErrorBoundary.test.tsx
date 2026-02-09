import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Suppress console.error from ErrorBoundary.componentDidCatch
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

const ThrowingComponent = () => {
  throw new Error('Test crash');
};

const WorkingComponent = () => (
  <View testID="working">
    <Text>Works fine</Text>
  </View>
);

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>,
    );

    expect(getByTestId('working')).toBeTruthy();
  });

  it('should render fallback UI when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(getByText('Что-то пошло не так')).toBeTruthy();
    expect(getByText('Попробовать снова')).toBeTruthy();
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = <Text>Custom error screen</Text>;

    const { getByText } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(getByText('Custom error screen')).toBeTruthy();
  });

  it('should show error details in dev mode', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    // __DEV__ is true in test environment
    expect(getByText(/Test crash/)).toBeTruthy();
  });
});
