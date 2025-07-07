'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './store';

/**
 * A React component that provides the Redux store to the entire application.
 * It's designed to work correctly within the Next.js App Router environment,
 * ensuring the store is created only once on the client side.
 * This component should wrap the root layout of your application.
 */
export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);

  // This pattern is crucial for Next.js. It prevents the store from being
  // re-created on every render. The store instance is created the first time
  // the component renders and then persisted in a `useRef` hook.
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  // The `Provider` component from `react-redux` makes the Redux store
  // available to any nested components that need to access it.
  return <Provider store={storeRef.current}>{children}</Provider>;
}