const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const REALTIME_LINES = ["11", "12", "13", "26", "30", "31", "32"];

const CENTRUM_STOPS = [
  { stopId: "0569", name: "Sorin aukio C", lines: ["11", "13", "26"] },
  { stopId: "0522", name: "Linja-autoasema", lines: ["12", "30", "31", "32"] },
];

const getRealtimeDepartures = async (req, res) => {
  const stopId = req.params.stopId;
  try {
    const apiUrl = `http://data.itsfactory.fi/journeys/api/1/stop-monitoring?stops=${stopId}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    // console.log("Real-time API response:", JSON.stringify(data, null, 2));

    const departures = [];
    const stopData = data.body && data.body[stopId];
    if (Array.isArray(stopData)) {
      stopData.forEach((item) => {
        if (REALTIME_LINES.includes(item.lineRef)) {
          const depTime =
            item.call?.expectedDepartureTime || item.call?.aimedDepartureTime;
          if (depTime) {
            const depDate = new Date(depTime);
            const now = new Date();
            const diff = Math.round((depDate - now) / 60000);
            departures.push(
              `${item.lineRef} | ${diff} min (${depDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })})`
            );
          }
        }
      });
    }

    departures.sort((a, b) => {
      const minA = parseInt(a.split(" | ")[1]);
      const minB = parseInt(b.split(" | ")[1]);
      return minA - minB;
    });

    res.json(departures);
  } catch (error) {
    console.error("Error fetching real-time departures:", error);
    res.status(500).json({ error: "Failed to fetch real-time departures" });
  }
};

const getCentrumDepartures = async (req, res) => {
  try {
    const departures = [];
    for (const stop of CENTRUM_STOPS) {
      const apiUrl = `http://data.itsfactory.fi/journeys/api/1/stop-monitoring?stops=${stop.stopId}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      const stopData = data.body && data.body[stop.stopId];
      if (Array.isArray(stopData)) {
        stopData.forEach((item) => {
          if (stop.lines.includes(item.lineRef)) {
            const depTime =
              item.call?.expectedDepartureTime || item.call?.aimedDepartureTime;
            if (depTime) {
              const depDate = new Date(depTime);
              const now = new Date();
              const diff = Math.round((depDate - now) / 60000);
              departures.push({
                stopName: stop.name,
                line: item.lineRef,
                minutes: diff,
                time: depDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });
            }
          }
        });
      }
    }
    // Sort by soonest departure
    departures.sort((a, b) => a.minutes - b.minutes);
    res.json(departures);
  } catch (error) {
    console.error("Error fetching centrum departures:", error);
    res.status(500).json({ error: "Failed to fetch centrum departures" });
  }
};

module.exports = { getRealtimeDepartures, getCentrumDepartures };
