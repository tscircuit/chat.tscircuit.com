'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/app/(auth)/auth-store';
import { TscircuitAuthButton } from '@/components/tscircuit-auth-button';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAndSetUserFromToken } = useAuthStore();

  // Check for session token and handle errors
  useEffect(() => {
    // Check if there's an error in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      toast.error('Authentication failed. Please try again.');
      
      // Clean up the URL by removing the error parameter
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // Check and set user from token if present
    checkAndSetUserFromToken();
  }, [checkAndSetUserFromToken]);
  
  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12 bg-background border border-border py-10 shadow-md mx-auto">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Welcome Back!</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Continue with your tscircuit account
          </p>
        </div>
        
        <div className="flex flex-col gap-6 px-4 sm:px-16">
          <TscircuitAuthButton />
          
          <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
            {"By signing in, you agree to our "}
            <Link
              href="https://tscircuit.com/terms"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              target="_blank"
            >
              Terms of Service
            </Link>
            {" and "}
            <Link
              href="https://tscircuit.com/privacy"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}