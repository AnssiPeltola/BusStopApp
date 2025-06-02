import React, { useEffect, useState } from "react";

const RealtimeDepartures: React.FC = () => {
  const [departures, setDepartures] = useState<string[]>([]);

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        const response = await fetch("/api/stops/2509/realtime");
        const data: string[] = await response.json();
        setDepartures(data);
      } catch (error) {
        console.error("Error fetching real-time departures:", error);
      }
    };

    fetchDepartures();

    // Optionally refresh every 30 seconds
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Real-time Departures for Stop 2509 Vihilahti</h2>
      <ul>
        {departures.map((departure, idx) => (
          <li key={idx}>{departure}</li>
        ))}
      </ul>
    </div>
  );
};

export default RealtimeDepartures;
