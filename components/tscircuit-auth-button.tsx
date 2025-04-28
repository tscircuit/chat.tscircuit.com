'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTscircuitRegistryUrl } from '@/hooks/use-tscircuit-registry-url';
import Image from 'next/image';
const getNextUrl = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

export function TscircuitAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = useTscircuitRegistryUrl();

  const handleLogin = () => {
    setIsLoading(true);
    
    try {
      const nextUrl = getNextUrl();
      
      const authUrl = `${apiUrl}/internal/oauth/github/authorize?next=${encodeURIComponent(nextUrl)}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('GitHub login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex gap-2 items-center justify-center"
      onClick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? 'Redirecting...' : 'Sign in with tscircuit'}
      <Image src="/assets/ts.svg" alt="tscircuit logo" width={20} height={20} />
    </Button>
  );
}