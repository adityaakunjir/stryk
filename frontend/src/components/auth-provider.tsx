"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/nextjs";

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

const MockAuthContext = createContext<AuthContextType>({
  isLoaded: true,
  isSignedIn: false,
  user: null,
  getToken: async () => "mock_user_demo12345",
});

export function useMockAuth() {
  return useContext(MockAuthContext);
}

// Unified authentication hook
export function useStrykAuth(): AuthContextType {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();
  const mockAuth = useMockAuth();

  if (clerkAuth.isSignedIn) {
    return {
      isLoaded: clerkAuth.isLoaded && clerkUser.isLoaded,
      isSignedIn: true,
      user: clerkUser.user
        ? {
            id: clerkUser.user.id,
            fullName: clerkUser.user.fullName || "STRYK Player",
            primaryEmailAddress: {
              emailAddress:
                clerkUser.user.primaryEmailAddress?.emailAddress || "",
            },
          }
        : null,
      getToken: async () => clerkAuth.getToken(),
    };
  }

  if (!clerkAuth.isLoaded) {
    return {
      isLoaded: false,
      isSignedIn: false,
      user: null,
      getToken: async () => null,
    };
  }

  return mockAuth;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<StrykUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      // Check local storage under demo mode
      const demoAuth = localStorage.getItem("stryk_demo_auth");
      if (demoAuth === "true") {
        setIsSignedIn(true);

        const storedPlayer = localStorage.getItem("stryk_player_data");
        let fullName = "Demo Player";
        if (storedPlayer) {
          try {
            const parsed = JSON.parse(storedPlayer);
            fullName = parsed.fullName || fullName;
          } catch {
            // Keep the fallback demo name if saved data is malformed.
          }
        }

        setUser({
          id: "user_demo12345",
          fullName: fullName,
          primaryEmailAddress: { emailAddress: "demo@stryk.app" },
        });
      } else {
        setIsSignedIn(false);
        setUser(null);
      }
      setIsLoaded(true);
    });
  }, []);

  const getToken = async () => {
    return `mock_${user?.id || "user_demo12345"}`;
  };

  // Fallback: Mock Auth Context Provider
  return (
    <MockAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user,
        getToken,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}
