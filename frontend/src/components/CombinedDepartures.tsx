import React, { useEffect, useState } from "react";

type Departure = {
  line: string;
  scheduled: Date;
  realtime?: Date;
  diffMinutes?: number;
};

function parseDepartureString(
  str: string
): { line: string; minutes: number; time: string } | null {
  // Example: "30 | 19 min (22.57)"
  const match = str.match(/^(\d+) \| (-?\d+) min \(([\d:.]+)\)$/);
  if (!match) return null;
  return { line: match[1], minutes: parseInt(match[2]), time: match[3] };
}

const CombinedDepartures: React.FC = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);

  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [offlineRes, realtimeRes] = await Promise.all([
          fetch("/api/stops/2509/departures"),
          fetch("/api/stops/2509/realtime"),
        ]);
        const offlineData: string[] = await offlineRes.json();
        const realtimeData: string[] = await realtimeRes.json();

        // Parse offline data
        const offlineParsed = offlineData
          .map(parseDepartureString)
          .filter(Boolean) as { line: string; minutes: number; time: string }[];

        // Parse real-time data
        const realtimeParsed = realtimeData
          .map(parseDepartureString)
          .filter(Boolean) as { line: string; minutes: number; time: string }[];

        // Combine by line (show only the soonest for each line)
        const combined: Departure[] = offlineParsed.map((off) => {
          // Find a real-time match for the same line and scheduled time (within a few minutes)
          const real = realtimeParsed.find(
            (r) =>
              r.line === off.line &&
              Math.abs(
                // Compare scheduled and real-time times in minutes
                parseInt(r.time.replace(":", "")) -
                  parseInt(off.time.replace(":", ""))
              ) <= 5 // allow 5 min difference for matching
          );
          let scheduled = new Date();
          const [h, m] = off.time.split(".").map(Number);
          scheduled.setHours(h, m, 0, 0);
          let realtime: Date | undefined = undefined;
          if (real) {
            const [rh, rm] = real.time.split(".").map(Number);
            realtime = new Date();
            realtime.setHours(rh, rm, 0, 0);
          }
          let diffMinutes = undefined;
          if (realtime) {
            diffMinutes = Math.round(
              (realtime.getTime() - scheduled.getTime()) / 60000
            );
          }
          return {
            line: off.line,
            scheduled,
            realtime,
            diffMinutes,
          };
        });

        // Filter out departures that have already left (e.g. minutesUntil < -2)
        const now = new Date();
        const filtered = combined.filter((dep) => {
          const showTime = dep.realtime ?? dep.scheduled;
          const minutesUntil = Math.round(
            (showTime.getTime() - now.getTime()) / 60000
          );
          return minutesUntil >= -2; // show only departures that are not too far in the past
        });

        // Sort by actual departure time
        filtered.sort((a, b) => {
          const aTime = (a.realtime ?? a.scheduled).getTime();
          const bTime = (b.realtime ?? b.scheduled).getTime();
          return aTime - bTime;
        });

        setDepartures(filtered);
      } catch (error) {
        console.error("Error fetching departures:", error);
      }
    };

    fetchBoth();
    const interval = setInterval(fetchBoth, 30000);
    return () => clearInterval(interval);
  }, []);

  function getColor(diff?: number) {
    if (diff === undefined) return "gray";
    if (Math.abs(diff) <= 1) return "green";
    if (diff > 1) return "red";
    if (diff < -1) return "goldenrod";
    return "gray";
  }

  return (
    <div>
      <h2>Departures for Stop 2509 Vihilahti</h2>
      <ul>
        {departures.map((dep, idx) => {
          // Use real-time if available, otherwise scheduled
          const showTime = dep.realtime ?? dep.scheduled;
          const now = new Date();
          const minutesUntil = Math.round(
            (showTime.getTime() - now.getTime()) / 60000
          );

          let status = "";
          let color = getColor(dep.diffMinutes);
          if (dep.diffMinutes === undefined) {
            status = "";
          } else if (Math.abs(dep.diffMinutes) <= 1) {
            status = "(on time)";
          } else if (dep.diffMinutes > 1) {
            status = `(late +${dep.diffMinutes}min)`;
          } else if (dep.diffMinutes < -1) {
            status = `(early ${dep.diffMinutes}min)`;
          }

          return (
            <li key={idx} style={{ color }}>
              {dep.line} | {minutesUntil} min (
              {showTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              ){" "}
              {status && (
                <span style={{ marginLeft: 8, fontSize: "0.9em" }}>
                  {status}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CombinedDepartures;
