'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function FaviconSwitcher() {
  const { systemTheme } = useTheme();

  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (favicon) {
      favicon.href = systemTheme === 'dark' ? '/favicon-dark.ico' : '/favicon-light.ico';
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = systemTheme === 'dark' ? '/favicon-dark.ico' : '/favicon-light.ico';
      document.head.appendChild(newFavicon);
    }
  }, [systemTheme]);

  return null;
} 