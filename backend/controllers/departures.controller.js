const fs = require("fs");
const path = require("path");

const getDepartures = async (req, res) => {
  const stopId = req.params.stopId.padStart(4, "0"); // or just use as-is if your JSON files use unpadded IDs
  const gtfsPath = path.join(__dirname, "..", "data", "gtfs");
  const jsonFile = path.join(gtfsPath, `departures_${stopId}.json`);

  try {
    if (!fs.existsSync(jsonFile)) {
      return res.status(404).json({ error: "No departures for this stop." });
    }
    const data = fs.readFileSync(jsonFile, "utf8");
    const stopTimes = JSON.parse(data);

    // Group all departures by line
    const now = new Date();
    const departuresByLine = {};
    stopTimes.forEach((stop) => {
      if (!departuresByLine[stop.route_short_name]) {
        departuresByLine[stop.route_short_name] = [];
      }
      departuresByLine[stop.route_short_name].push(stop.departure_time);
    });

    // For each line, find the soonest departure after now
    const nextDepartures = {};
    Object.entries(departuresByLine).forEach(([route_short_name, times]) => {
      let soonestDiff = Infinity;
      let soonestTime = null;
      let soonestFormatted = "";

      times.forEach((depTimeStr) => {
        let [h, m, s] = depTimeStr.split(":").map(Number);
        let depTime = new Date(now);
        if (h >= 24) {
          depTime.setDate(depTime.getDate() + 1);
          h = h - 24;
        }
        depTime.setHours(h, m, s || 0, 0);
        const diff = Math.round((depTime - now) / 60000);
        if (diff >= 0 && diff < soonestDiff) {
          soonestDiff = diff;
          soonestTime = depTimeStr;
          soonestFormatted = depTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      });

      if (soonestTime !== null) {
        nextDepartures[route_short_name] = {
          route_short_name,
          time_diff: soonestDiff,
          formatted_time: soonestFormatted,
        };
      }
    });

    // Format the response
    const formattedDepartures = Object.values(nextDepartures)
      .sort((a, b) => a.time_diff - b.time_diff)
      .map(
        (stop) =>
          `${stop.route_short_name} | ${stop.time_diff} min (${stop.formatted_time})`
      );

    res.json(formattedDepartures);
  } catch (error) {
    console.error("Error loading departures:", error);
    res.status(500).json({ error: "Failed to load departures" });
  }
};

module.exports = { getDepartures };
