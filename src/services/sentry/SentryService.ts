/**
 * Sentry crash reporting stub.
 *
 * This is a no-op placeholder. To enable Sentry:
 * 1. npm install @sentry/react-native sentry-expo
 * 2. Add "sentry-expo" to plugins in app.json
 * 3. Replace this file with the real implementation
 * 4. Set EXPO_PUBLIC_SENTRY_DSN in .env
 */

export function initSentry() {
  // no-op until @sentry/react-native is installed
}

export function captureException(error: Error, _context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('[Sentry stub]', error);
  }
}

export function setUser(_userId: string | null) {
  // no-op
}

export function addBreadcrumb(
  _message: string,
  _category: string,
  _data?: Record<string, unknown>,
) {
  // no-op
}
