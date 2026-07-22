'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App } from '@capacitor/app';

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleBackButton = async (data) => {
      // Exit the app if the user is on the main landing views, or there's no history stack to go back to.
      const isHubView = ['/dashboard', '/setup', '/'].includes(pathname);
      if (isHubView || !data.canGoBack) {
        await App.exitApp();
      } else {
        router.back();
      }
    };

    const setupListener = async () => {
      return await App.addListener('backButton', handleBackButton);
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then((l) => l.remove());
    };
  }, [pathname, router]);

  return null;
}
