import type { Metadata } from 'next';
import { Suspense } from 'react';
import { App } from './App';

export default function ({ children }) {
  return (
    <Suspense>
      <App>{children}</App>
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s | FS INF Analytics',
    default: 'FS INF Analytics',
  },
};
