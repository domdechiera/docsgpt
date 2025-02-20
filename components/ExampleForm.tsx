'use client';

import { useState } from 'react';
import VercelCaptcha from './VercelCaptcha';

export default function ExampleForm() {
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setMessage('Please complete the CAPTCHA');
      return;
    }

    try {
      // Verify the CAPTCHA token
      const verifyResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: captchaToken }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setMessage('CAPTCHA verification failed');
        return;
      }

      // If CAPTCHA is verified, proceed with your form submission
      setMessage('Form submitted successfully!');
      // Add your form submission logic here
      
    } catch (error) {
      setMessage('An error occurred');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Your form fields here */}
      
      <VercelCaptcha onVerify={setCaptchaToken} />
      
      {message && (
        <p className={message.includes('success') ? 'text-green-600' : 'text-red-600'}>
          {message}
        </p>
      )}
      
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
} 