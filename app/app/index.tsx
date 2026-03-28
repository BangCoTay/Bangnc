import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isAuthenticated) {
    if (user?.is_admin) {
      return <Redirect href="/(admin)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
