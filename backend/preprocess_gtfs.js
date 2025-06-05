const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const stopsOfInterest = ["2509", "0569", "0522"];
const desiredRoutes = new Set(["11", "12", "13", "26", "30", "31", "32"]);
const gtfsPath = path.join(__dirname, "data", "gtfs");

const stopTimesFile = path.join(gtfsPath, "stop_times.txt");
const gtfsMtime = fs.statSync(stopTimesFile).mtimeMs;
let needsUpdate = false;

for (const stopId of stopsOfInterest) {
  const cacheFile = path.join(__dirname, `departures_${stopId}.json`);
  let cacheMtime = 0;
  try {
    cacheMtime = fs.statSync(cacheFile).mtimeMs;
  } catch (e) {
    // cache file does not exist
    needsUpdate = true;
    break;
  }
  if (gtfsMtime > cacheMtime) {
    needsUpdate = true;
    break;
  }
}

if (!needsUpdate) {
  console.log("Departures cache is up to date. No need to preprocess.");
  process.exit(0);
}

async function preprocess() {
  // Load trips.txt
  const tripsMap = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(gtfsPath, "trips.txt"))
      .pipe(csv())
      .on("data", (data) => {
        tripsMap.set(data.trip_id, {
          trip_headsign: data.trip_headsign,
          route_id: data.route_id,
          service_id: data.service_id,
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  // Load routes.txt
  const routesMap = new Map();
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(gtfsPath, "routes.txt"))
      .pipe(csv())
      .on("data", (data) => {
        routesMap.set(data.route_id, {
          route_short_name: data.route_short_name,
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  // Calculate valid service IDs for today
  const validServiceIds = new Set();
  const today = new Date();
  const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(gtfsPath, "calendar.txt"))
      .pipe(csv())
      .on("data", (data) => {
        if (
          yyyyMMdd >= data.start_date &&
          yyyyMMdd <= data.end_date &&
          data[
            today.toLocaleString("en-US", { weekday: "long" }).toLowerCase()
          ] === "1"
        ) {
          validServiceIds.add(data.service_id);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(gtfsPath, "calendar_dates.txt"))
      .pipe(csv())
      .on("data", (data) => {
        if (data.date === yyyyMMdd) {
          if (data.exception_type === "1") validServiceIds.add(data.service_id);
          else if (data.exception_type === "2")
            validServiceIds.delete(data.service_id);
        }
      })
      .on("end", resolve)
      .on("error", (err) => {
        if (err.code !== "ENOENT") reject(err);
        else resolve();
      });
  });

  // For each stop, filter stop_times and write JSON
  for (const stopId of stopsOfInterest) {
    const stopTimes = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(gtfsPath, "stop_times.txt"))
        .pipe(csv())
        .on("data", (data) => {
          if (data.stop_id === stopId) {
            const trip = tripsMap.get(data.trip_id);
            if (!trip) return;
            const route = routesMap.get(trip.route_id);
            if (
              route &&
              desiredRoutes.has(route.route_short_name) &&
              validServiceIds.has(trip.service_id)
            ) {
              stopTimes.push({
                route_short_name: route.route_short_name,
                departure_time: data.departure_time,
              });
            }
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });
    fs.writeFileSync(
      path.join(gtfsPath, `departures_${stopId}.json`),
      JSON.stringify(stopTimes, null, 2)
    );
    console.log(
      `Wrote departures_${stopId}.json (${stopTimes.length} departures)`
    );
  }
}

preprocess();
