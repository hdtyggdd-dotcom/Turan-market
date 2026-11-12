import React from 'react';
import { Redirect } from 'expo-router';

// Keep old bookmarks working without a second, phone-only entry form.
export default function LoginRedirect() {
  return <Redirect href="/auth/register" />;
}
