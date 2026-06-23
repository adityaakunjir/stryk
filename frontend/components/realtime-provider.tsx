"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PusherClient from "pusher-js";

// We keep a single instance at module level to avoid duplicate connections
let pusherClientInstance: PusherClient | null = null;

export function RealtimeProvider() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Initialize Pusher Client if not already initialized
    if (!pusherClientInstance) {
      const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      
      if (key && cluster) {
        pusherClientInstance = new PusherClient(key, {
          cluster,
        });
      }
    }

    if (!pusherClientInstance) return;

    // Listen on a unique unauthenticated channel for this user
    const channelName = `user-${user.id}`;
    const channel = pusherClientInstance.subscribe(channelName);

    channel.bind("match-invite", (data: any) => {
      console.log("Received match invite:", data);
      
      toast(`You were invited to a match!`, {
        description: `${data.senderName} invited you to play in '${data.matchTitle}'.`,
        action: {
          label: "Join Match",
          onClick: () => {
            router.push(`/matches/${data.matchId}`);
          },
        },
        duration: 10000,
      });
    });

    return () => {
      channel.unbind("match-invite");
      pusherClientInstance?.unsubscribe(channelName);
    };
  }, [user, isLoaded, router]);

  return null;
}
