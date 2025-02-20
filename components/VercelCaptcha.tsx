'use client';

import { useCallback, useEffect, useState } from 'react';

interface VercelCaptchaProps {
  onVerify: (token: string) => void;
}

export default function VercelCaptcha({ onVerify }: VercelCaptchaProps) {
  const [turnstile, setTurnstile] = useState<any>();

  useEffect(() => {
    if ((window as any).turnstile) {
      setTurnstile((window as any).turnstile);
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        setTurnstile((window as any).turnstile);
      };
    }
  }, []);

  const onVerifyCallback = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  useEffect(() => {
    if (turnstile) {
      turnstile.render('#captcha-container', {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: onVerifyCallback,
      });
    }
  }, [turnstile, onVerifyCallback]);

  return <div id="captcha-container" />;
} 