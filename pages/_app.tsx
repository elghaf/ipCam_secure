import type { AppProps } from 'next/app'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize focus-visible on the client side only
    import('focus-visible')
  }, [])

  return <Component {...pageProps} />
}

export default MyApp