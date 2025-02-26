import { useEffect } from 'react';
import { initFocusVisible } from '@/lib/focus-visible';
import { preventExtensionInterference } from '@/lib/preventExtensionInterference';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize focus-visible on the client side only
    initFocusVisible();
    // Prevent extension interference
    preventExtensionInterference();
  }, []);

  return <Component {...pageProps} />;
}
