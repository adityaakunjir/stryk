"use client";

import React from "react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/clerk-react";

interface StrykUser {
  id: string;
  fullName: string;
  primaryEmailAddress: { emailAddress: string };
}

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: StrykUser | null;
  getToken: () => Promise<string | null>;
}

// Unified authentication hook — Clerk only, no mock/demo mode
export function useStrykAuth(): AuthContextType {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();

  if (!clerkAuth.isLoaded) {
    return {
      isLoaded: false,
      isSignedIn: false,
      user: null,
      getToken: async () => null,
    };
  }

  if (clerkAuth.isSignedIn && clerkUser.user) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: clerkUser.user.id,
        fullName: clerkUser.user.fullName || "STRYK Player",
        primaryEmailAddress: {
          emailAddress:
            clerkUser.user.primaryEmailAddress?.emailAddress || "",
        },
      },
      getToken: async () => clerkAuth.getToken(),
    };
  }

  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
    getToken: async () => null,
  };
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

// AuthProvider wraps ClerkProvider on the client side
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
