export function preventExtensionInterference() {
  // Prevent browser extensions from interfering with the app
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      if (e.message.includes('extension')) {
        e.preventDefault();
      }
    });
  }
} 