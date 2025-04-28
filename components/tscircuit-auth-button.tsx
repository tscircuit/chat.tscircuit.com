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

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    
    try {
      // Get the URL for initiating GitHub OAuth
      const nextUrl = getNextUrl();
      const apiUrl = useTscircuitRegistryUrl();
      
      // Redirect to the GitHub OAuth authorization endpoint
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
      onClick={handleGitHubLogin}
      disabled={isLoading}
    >
      {isLoading ? 'Redirecting...' : 'Sign in with tscircuit'}
      <Image src="/assets/ts.svg" alt="tscircuit logo" width={20} height={20} />
    </Button>
  );
}