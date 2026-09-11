"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTopic } from "@/lib/realtime";
import Detail from "@/components/ui/Detail";

const EventAvailabilityContext = createContext(null);

// Applies fresh counts ({ id, available_count, resale_count, resale_from_cents })
// to the sections we already have, which also carry names and prices.
function applyCounts(sections, counts) {
  const countsById = new Map(counts.map((count) => [count.id, count]));
  return sections.map((section) =>
    countsById.has(section.id) ? { ...section, ...countsById.get(section.id) } : section
  );
}

const resaleTotal = (sections) => sections.reduce((sum, section) => sum + section.resale_count, 0);

// Keeps an event's ticket counts live. When any of the event's tickets
// change, a database trigger broadcasts a fresh snapshot on the channel
// "event:<id>", and Supabase Realtime pushes it to every open event page
// over a WebSocket. Without a connection, the server-rendered counts are used.
// initialSections: rows from the section_availability view.
export function EventAvailabilityProvider({ eventId, initialSections, children }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [isLive, setIsLive] = useState(false);
  const [nextHoldExpiresAt, setNextHoldExpiresAt] = useState(null);
  const sectionsRef = useRef(initialSections);

  const applySnapshot = useCallback(
    (snapshot) => {
      const resaleBefore = resaleTotal(sectionsRef.current);
      const next = applyCounts(sectionsRef.current, snapshot.sections);
      sectionsRef.current = next;
      setSections(next);
      setNextHoldExpiresAt(snapshot.next_hold_expires_at);
      // The resale list is rendered on the server, so re-fetch it when it changes.
      if (resaleTotal(next) !== resaleBefore) router.refresh();
    },
    [router]
  );

  const loadSnapshot = useCallback(async () => {
    const { data, error } = await createClient().rpc("event_availability", { p_event_id: eventId });
    if (!error && data) applySnapshot(data);
  }, [eventId, applySnapshot]);

  useEffect(
    () =>
      subscribeToTopic(
        `event:${eventId}`,
        (channel, dispatch) =>
          channel.on("broadcast", { event: "availability" }, ({ payload }) => dispatch(payload)),
        {
          onMessage: applySnapshot,
          onStatus: (status) => {
            setIsLive(status === "SUBSCRIBED");
            // Catch up on anything that changed before the connection opened.
            if (status === "SUBSCRIBED") loadSnapshot();
          },
        }
      ),
    [eventId, applySnapshot, loadSnapshot]
  );

  // Holds end silently (no ticket rows change), so re-check when the next
  // one runs out.
  useEffect(() => {
    if (!nextHoldExpiresAt) return;
    const delay = Math.max(0, new Date(nextHoldExpiresAt).getTime() - Date.now() + 1000);
    const timer = setTimeout(loadSnapshot, delay);
    return () => clearTimeout(timer);
  }, [nextHoldExpiresAt, loadSnapshot]);

  return (
    <EventAvailabilityContext.Provider value={{ sections: isLive ? sections : initialSections, isLive }}>
      {children}
    </EventAvailabilityContext.Provider>
  );
}

export function useEventAvailability() {
  return useContext(EventAvailabilityContext);
}

// "Tickets left: 1,997 of 2,000", kept live.
export function LiveTicketsLeft() {
  const { sections } = useEventAvailability();
  const capacity = sections.reduce((sum, section) => sum + section.capacity, 0);
  const available = sections.reduce((sum, section) => sum + section.available_count, 0);
  const resale = resaleTotal(sections);

  return (
    <Detail
      icon={Ticket}
      label="Tickets left"
      value={`${available.toLocaleString("en-US")} of ${capacity.toLocaleString("en-US")}`}
      note={resale > 0 ? `${resale} on resale` : "No resale tickets yet"}
    />
  );
}

// Pulsing "Live" pill, shown while the WebSocket is connected.
export function LiveBadge() {
  const { isLive } = useEventAvailability();
  if (!isLive) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary-text"
      title="Ticket counts update in real time"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      Live
    </span>
  );
}
