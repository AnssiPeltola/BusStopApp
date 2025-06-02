const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { getDepartures } = require("./controllers/departures.controller");
const { getRealtimeDepartures } = require("./controllers/realtime.controller");
const { getCentrumDepartures } = require("./controllers/realtime.controller");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Perus testiroute
app.get("/", (req, res) => {
  res.send("Backend toimii!");
});

// Endpoint: /api/stops
app.get("/api/stops", (req, res) => {
  const results = [];
  const stopsFilePath = path.join(__dirname, "data", "gtfs", "stops.txt");

  fs.createReadStream(stopsFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    })
    .on("error", (error) => {
      console.error("CSV parsing error:", error);
      res.status(500).json({ error: "Failed to parse stops file" });
    });
});

// Endpoint: /api/stops/:stopId/realtime
// Tämä endpoint hakee reaaliaikaiset lähdöt annetulle pysäkille
app.get("/api/stops/:stopId/realtime", getRealtimeDepartures);

// Endpoint: /api/centrum/departures
// Tämä endpoint hakee lähdöt keskustan pysäkeiltä
app.get("/api/centrum/departures", getCentrumDepartures);

app.get("/api/stops/:stopId/departures", getDepartures);
// Uusi endpoint: /api/stops/:stopId/departures
// app.get("/api/stops/:stopId/departures", async (req, res) => {
//   const stopId = req.params.stopId;
//   const stopTimes = [];
//   const tripsMap = new Map();
//   const routesMap = new Map();

//   try {
//     // Ladataan trips.txt tiedot muistiin
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(path.join(__dirname, "data", "gtfs", "trips.txt"))
//         .pipe(csv())
//         .on("data", (data) => {
//           tripsMap.set(data.trip_id, {
//             trip_headsign: data.trip_headsign,
//             route_id: data.route_id,
//           });
//         })
//         .on("end", resolve)
//         .on("error", reject);
//     });

//     // Ladataan routes.txt tiedot muistiin
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(path.join(__dirname, "data", "gtfs", "routes.txt"))
//         .pipe(csv())
//         .on("data", (data) => {
//           routesMap.set(data.route_id, {
//             route_short_name: data.route_short_name,
//           });
//         })
//         .on("end", resolve)
//         .on("error", reject);
//     });

//     // Suodatetaan stop_times.txt tiedot
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(
//         path.join(__dirname, "data", "gtfs", "stop_times.txt")
//       )
//         .pipe(csv())
//         .on("data", (data) => {
//           if (data.stop_id === stopId) {
//             const trip = tripsMap.get(data.trip_id);
//             if (trip) {
//               const route = routesMap.get(trip.route_id);
//               stopTimes.push({
//                 departure_time: data.departure_time,
//                 trip_headsign: trip.trip_headsign,
//                 route_short_name: route ? route.route_short_name : "",
//               });
//             }
//           }
//         })
//         .on("end", resolve)
//         .on("error", reject);
//     });

//     // Lähetetään tulokset
//     res.json(stopTimes);
//   } catch (error) {
//     console.error("Error loading departures:", error);
//     res.status(500).json({ error: "Failed to load departures" });
//   }
// });

app.listen(PORT, () => {
  console.log(`Backend käynnissä portissa ${PORT}`);
});
