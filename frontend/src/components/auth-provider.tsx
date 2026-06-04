"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
  // Use Clerk's hooks if Clerk is configured
  const clerkAuth = hasClerkKeys ? useClerkAuth() : null;
  const clerkUser = hasClerkKeys ? useClerkUser() : null;
  const mockAuth = useMockAuth();

  if (hasClerkKeys) {
    const adaptedUser = clerkUser?.user ? {
      id: clerkUser.user.id,
      fullName: clerkUser.user.fullName || "",
      primaryEmailAddress: { emailAddress: clerkUser.user.primaryEmailAddress?.emailAddress || "" },
    } : null;

    return {
      isLoaded: clerkAuth?.isLoaded ?? false,
      isSignedIn: clerkAuth?.isSignedIn ?? false,
      user: adaptedUser,
      getToken: async () => {
        if (!clerkAuth?.getToken) return null;
        return clerkAuth.getToken();
      },
    };
  }

  return mockAuth;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<StrykUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (hasClerkKeys) {
      setIsLoaded(true);
      return;
    }
    
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
        } catch (_) {}
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
  }, []);

  const getToken = async () => {
    return `mock_${user?.id || "user_demo12345"}`;
  };

  if (hasClerkKeys) {
    return (
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#bef518",
            colorBackground: "#0a0f12",
            colorInputBackground: "#111820",
            colorInputText: "#ffffff",
            borderRadius: "1rem",
          },
          elements: {
            formButtonPrimary:
              "bg-lime-400 text-black font-black hover:bg-lime-300 transition",
            card: "bg-[#0a0f12] border border-lime-300/20 shadow-[0_20px_80px_rgba(0,0,0,0.5)]",
            headerTitle: "text-white font-black",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton:
              "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]",
            footerActionLink: "text-lime-300 font-bold hover:text-lime-200",
          },
        }}
        signInUrl="/login"
        signUpUrl="/sign-up"
        afterSignOutUrl="/"
      >
        {children}
      </ClerkProvider>
    );
  }

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
