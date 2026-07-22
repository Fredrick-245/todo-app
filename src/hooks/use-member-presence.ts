"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppMember } from "@/lib/allowed-users";
import { formatLastActive } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";

type PresencePayload = {
  user_id: string;
  online_at: string;
};

export function useMemberPresence(
  members: AppMember[],
  currentUserId: string,
) {
  const otherMember = useMemo(
    () => members.find((member) => member.id !== currentUserId) ?? null,
    [members, currentUserId],
  );

  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const fetchOtherLastSeen = useCallback(async () => {
    if (!otherMember) {
      setLastSeenAt(null);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("member_activity")
      .select("last_seen_at")
      .eq("user_id", otherMember.id)
      .maybeSingle();

    if (data?.last_seen_at) {
      setLastSeenAt(data.last_seen_at);
    }
  }, [otherMember]);

  const pingActivity = useCallback(async () => {
    const supabase = createClient();
    await supabase.from("member_activity").upsert(
      {
        user_id: currentUserId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }, [currentUserId]);

  useEffect(() => {
    void pingActivity();
    const heartbeat = window.setInterval(() => {
      void pingActivity();
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pingActivity();
      }
    };

    const handlePageHide = () => {
      void pingActivity();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pingActivity]);

  useEffect(() => {
    void fetchOtherLastSeen();
  }, [fetchOtherLastSeen]);

  useEffect(() => {
    if (!otherMember) return;

    const supabase = createClient();
    const channel = supabase.channel("app-presence", {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        const online = Object.values(state).some((presences) =>
          presences.some((presence) => presence.user_id === otherMember.id),
        );
        setIsOnline(online);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if (
          newPresences.some(
            (presence) =>
              (presence as unknown as PresencePayload).user_id === otherMember.id,
          )
        ) {
          setIsOnline(true);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if (
          leftPresences.some(
            (presence) =>
              (presence as unknown as PresencePayload).user_id === otherMember.id,
          )
        ) {
          setIsOnline(false);
          void fetchOtherLastSeen();
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          } satisfies PresencePayload);
        }
      });

    const activityChannel = supabase
      .channel("member-activity-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_activity",
          filter: `user_id=eq.${otherMember.id}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { last_seen_at?: string };
          if (row.last_seen_at) {
            setLastSeenAt(row.last_seen_at);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(activityChannel);
    };
  }, [currentUserId, fetchOtherLastSeen, otherMember]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel = isOnline
    ? "Online"
    : lastSeenAt
      ? formatLastActive(lastSeenAt, now)
      : null;

  return {
    otherMember,
    isOnline,
    lastSeenAt,
    statusLabel,
  };
}
