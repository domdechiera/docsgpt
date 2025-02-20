'use client';

import { useCallback, useEffect, useState } from 'react';

interface VercelCaptchaProps {
  onVerify: (token: string) => void;
}

export default function VercelCaptcha({ onVerify }: VercelCaptchaProps) {
  const [turnstile, setTurnstile] = useState<any>();
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.error('Turnstile site key is not configured');
      setError('CAPTCHA configuration error');
      return;
    }

    if ((window as any).turnstile) {
      setTurnstile((window as any).turnstile);
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
      };
    }
  }, [siteKey]);

  const onVerifyCallback = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  useEffect(() => {
    if (turnstile && siteKey) {
      turnstile.render('#captcha-container', {
        sitekey: siteKey,
        callback: onVerifyCallback,
      });
    }
  }, [turnstile, siteKey, onVerifyCallback]);

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return <div id="captcha-container" />;
} 