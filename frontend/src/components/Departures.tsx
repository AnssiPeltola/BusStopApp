import React, { useEffect, useState } from "react";

const Departures: React.FC = () => {
  const [departures, setDepartures] = useState<string[]>([]);

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        const response = await fetch("/api/stops/2509/departures");
        const data: string[] = await response.json();
        setDepartures(data);
      } catch (error) {
        console.error("Error fetching departures:", error);
      }
    };

    fetchDepartures();
  }, []);

  return (
    <div>
      <h2>Next Bus Departures for Stop 2509 Vihilahti</h2>
      <ul>
        {departures.map((departure, index) => (
          <li key={index}>{departure}</li>
        ))}
      </ul>
    </div>
  );
};

export default Departures;
