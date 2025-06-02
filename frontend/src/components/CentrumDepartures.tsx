import React, { useEffect, useState } from "react";

interface Departure {
  stopName: string;
  line: string;
  minutes: number;
  time: string;
}

const CentrumDepartures: React.FC = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        const response = await fetch("/api/centrum/departures");
        const data = await response.json();
        setDepartures(data);
      } catch (error) {
        console.error("Error fetching centrum departures:", error);
      }
    };
    fetchDepartures();
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Buses from Centrum to Home</h2>
      <ul>
        {departures.map((dep, idx) => (
          <li key={idx}>
            {dep.stopName} | {dep.line} | {dep.minutes} min ({dep.time})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CentrumDepartures;
