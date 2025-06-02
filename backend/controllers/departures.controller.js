const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const getDepartures = async (req, res) => {
  const stopId = req.params.stopId;
  const stopTimes = [];
  const tripsMap = new Map();
  const routesMap = new Map();
  const desiredRoutes = new Set(["11", "12", "13", "26", "30", "31", "32"]);

  try {
    // Load trips.txt data into memory
    await new Promise((resolve, reject) => {
      fs.createReadStream(
        path.join(__dirname, "..", "data", "gtfs", "trips.txt")
      )
        .pipe(csv())
        .on("data", (data) => {
          tripsMap.set(data.trip_id, {
            trip_headsign: data.trip_headsign,
            route_id: data.route_id,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Load routes.txt data into memory
    await new Promise((resolve, reject) => {
      fs.createReadStream(
        path.join(__dirname, "..", "data", "gtfs", "routes.txt")
      )
        .pipe(csv())
        .on("data", (data) => {
          routesMap.set(data.route_id, {
            route_short_name: data.route_short_name,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Load stop_times.txt data and filter for the specified stopId and desired routes
    await new Promise((resolve, reject) => {
      fs.createReadStream(
        path.join(__dirname, "..", "data", "gtfs", "stop_times.txt")
      )
        .pipe(csv())
        .on("data", (data) => {
          const trip = tripsMap.get(data.trip_id);
          if (!trip) return;
          const route = routesMap.get(trip.route_id);
          if (
            data.stop_id === stopId &&
            route &&
            desiredRoutes.has(route.route_short_name)
          ) {
            stopTimes.push({
              route_short_name: route.route_short_name,
              departure_time: data.departure_time,
            });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Find the next departure for each line
    const now = new Date();
    const nextDepartures = {};

    // Group all departures by line
    const departuresByLine = {};
    stopTimes.forEach((stop) => {
      if (!departuresByLine[stop.route_short_name]) {
        departuresByLine[stop.route_short_name] = [];
      }
      departuresByLine[stop.route_short_name].push(stop.departure_time);
    });

    // For each line, find the soonest departure after now
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
