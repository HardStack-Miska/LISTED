import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules before importing components
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

import OnboardingScreen, {
  isOnboardingComplete,
  markOnboardingComplete,
} from '@/app/onboarding';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
  Redirect: 'Redirect',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Onboarding', () => {
  describe('isOnboardingComplete', () => {
    it('should return false when not set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await isOnboardingComplete();
      expect(result).toBe(false);
    });

    it('should return true when marked complete', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const result = await isOnboardingComplete();
      expect(result).toBe(true);
    });
  });

  describe('markOnboardingComplete', () => {
    it('should save completion to AsyncStorage', async () => {
      await markOnboardingComplete();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@listed_onboarding_complete',
        'true',
      );
    });
  });

  describe('OnboardingScreen', () => {
    it('should render first slide', () => {
      const { getByText } = render(<OnboardingScreen />);

      expect(getByText('Управляйте задачами')).toBeTruthy();
      expect(getByText('Пропустить')).toBeTruthy();
      expect(getByText('Далее')).toBeTruthy();
    });

    it('should navigate to today when skip is pressed', async () => {
      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Пропустить'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@listed_onboarding_complete',
          'true',
        );
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/today');
      });
    });
  });
});
