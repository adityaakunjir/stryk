import PusherServer from "pusher";
import PusherClient from "pusher-js";

const hasServerKeys = !!(
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
  process.env.PUSHER_APP_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
);

export const pusherServer = hasServerKeys
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      secret: process.env.PUSHER_APP_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient | null => {
  if (typeof window === "undefined") return null;

  if (pusherClientInstance) return pusherClientInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn("Pusher keys are not defined in environment variables. Realtime features will not work.");
    return null;
  }

  pusherClientInstance = new PusherClient(key, {
    cluster,
    forceTLS: true,
  });

  return pusherClientInstance;
};

/**
 * Safely trigger a Pusher event from Next.js server actions / api routes.
 * Gracefully downgrades to a warn log when credentials are not configured.
 */
export const triggerPusherEvent = async (
  channel: string,
  event: string,
  data: any
) => {
  if (!pusherServer) {
    console.warn(`[Pusher Mock] Triggered event "${event}" on channel "${channel}" with data:`, data);
    return;
  }
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (error) {
    console.error(`Failed to trigger Pusher event "${event}" on channel "${channel}":`, error);
  }
};
