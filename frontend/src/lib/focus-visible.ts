export function initFocusVisible() {
  // Only run on client-side
  if (typeof window === 'undefined') return;
  
  // Use dynamic import to avoid SSR issues
  import('focus-visible').catch(err => {
    console.error('Failed to load focus-visible:', err);
  });
}
