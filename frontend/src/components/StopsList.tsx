import React, { useEffect, useState } from "react";

type Stop = {
  stop_id: string;
  stop_name: string;
};

const StopsList: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch("/api/stops");
        if (!response.ok) throw new Error("Failed to fetch stops");
        const data = await response.json();
        setStops(data);
      } catch (error) {
        console.error("Error fetching stops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, []);

  if (loading) return <p>Loading stops...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Pysäkit Tampereella</h2>
      <ul className="list-disc list-inside">
        {stops.map((stop) => (
          <li key={stop.stop_id}>{stop.stop_name}</li>
        ))}
      </ul>
    </div>
  );
};

export default StopsList;
