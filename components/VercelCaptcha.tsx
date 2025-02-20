'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

interface VercelCaptchaProps {
  onVerify: (token: string) => void;
}

export default function VercelCaptcha({ onVerify }: VercelCaptchaProps) {
  const [turnstile, setTurnstile] = useState<any>();
  const [error, setError] = useState<string | null>(null);
  const widgetId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Load the Turnstile script
  useEffect(() => {
    if (!siteKey) {
      console.error('Turnstile site key is not configured');
      setError('CAPTCHA configuration error');
      return;
    }

    let scriptLoaded = false;

    if ((window as any).turnstile) {
      setTurnstile((window as any).turnstile);
      scriptLoaded = true;
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setError('Failed to load CAPTCHA');
      };
      document.head.appendChild(script);
      script.onload = () => {
        setTurnstile((window as any).turnstile);
        scriptLoaded = true;
      };
    }

    // Cleanup function to remove widget when component unmounts
    return () => {
      if (scriptLoaded && widgetId.current) {
        (window as any).turnstile?.remove(widgetId.current);
      }
    };
  }, [siteKey]);

  const onVerifyCallback = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  // Render and manage the CAPTCHA widget
  useEffect(() => {
    if (!turnstile || !siteKey || !containerRef.current) return;

    // Clean up existing widget if it exists
    if (widgetId.current) {
      turnstile.remove(widgetId.current);
      widgetId.current = null;
    }

    // Create new widget
    widgetId.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerifyCallback,
      appearance: 'always',
    });

    // Cleanup function
    return () => {
      if (widgetId.current) {
        turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [turnstile, siteKey, onVerifyCallback]);

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return <div ref={containerRef} className="flex justify-center" />;
} 