import { useState } from 'react';

/**
 * Test component to verify ErrorBoundary functionality.
 * Provides buttons to trigger different types of errors.
 *
 * Usage:
 * 1. Import this component in your app
 * 2. Render it somewhere visible
 * 3. Click buttons to trigger test errors
 * 4. Verify ErrorBoundary catches them and shows fallback UI
 *
 * WARNING: This component is for development/testing only.
 * Do not include in production builds.
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // This will throw during render phase
  if (shouldThrow) {
    throw new Error('Test error thrown from ErrorBoundaryTest component');
  }

  const handleRenderError = () => {
    setShouldThrow(true);
  };

  const handleEventError = () => {
    // Note: Event handler errors are NOT caught by Error Boundaries
    // They need try/catch in the handler itself
    throw new Error('Event handler error (not caught by ErrorBoundary)');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
      <h3 className="text-white font-semibold mb-3 text-sm">
        Error Boundary Test
      </h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleRenderError}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          Trigger Render Error
        </button>
        <button
          onClick={handleEventError}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
        >
          Trigger Event Error
        </button>
        <p className="text-white/50 text-xs mt-2">
          Render errors are caught by ErrorBoundary.
          <br />
          Event errors are not (check console).
        </p>
      </div>
    </div>
  );
}

/**
 * Component that throws an error during render.
 * Useful for nested error boundary testing.
 */
export function ThrowOnRender({ message = 'Test render error' }: { message?: string }) {
  throw new Error(message);
}

/**
 * Component that throws after a delay.
 * Demonstrates async state update errors.
 */
export function ThrowAfterDelay({ delay = 2000 }: { delay?: number }) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error(`Delayed error after ${delay}ms`);
  }

  // Schedule error after delay
  useState(() => {
    setTimeout(() => setShouldThrow(true), delay);
  });

  return (
    <div className="text-white/50 text-sm">
      Error will occur in {delay}ms...
    </div>
  );
}

export default ErrorBoundaryTest;
