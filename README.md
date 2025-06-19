# BusStopApp

BusStopApp is a personal project for learning and practical use. It displays upcoming bus departures for my most-used stops in Tampere, Finland, with a focus on the Vihilahti (stop 2509) to city center route and return trips from Sorin aukio and nearby stops.

## Features

- **Offline GTFS Data:**  
  Uses preprocessed GTFS data for fast, reliable scheduled departure times.

- **Real-Time Data:**  
  Fetches live departure information from Tampere's ITSFactory API.

- **Combined View:**  
  Compares scheduled and real-time departures, showing if a bus is on time, late, or early with color coding:
  - Green: On time
  - Red: Late
  - Yellow: Early

- **Personalized Stops:**  
  Focuses on:
  - Vihilahti (2509) → Centrum
  - Sorin aukio (0569) and Linja-autoasema (0522) → Home

## How It Works

- **Backend:**  
  - Preprocesses GTFS data to create small JSON files for selected stops.
  - Provides API endpoints for both scheduled and real-time departures.

- **Frontend:**  
  - Fetches and displays both scheduled and real-time departures.
  - Highlights the status of each bus (on time, late, early).
  - Updates automatically every 30 seconds.

## Usage

1. **Clone the repository**
2. **Install dependencies** in both `backend` and `frontend` folders.
3. **Download and unzip GTFS data** into `backend/data/gtfs/`.
4. **Run the GTFS preprocessing script:**
   ```
   cd backend
   node preprocess_gtfs.js
   ```
5. **Start the backend and frontend servers.**
6. **Open the frontend in your browser.**

## Notes

- This app is for personal use and learning.
- Only a few stops and lines are supported, as configured in the code.
- Real-time data is fetched from [ITSFactory](https://www.itsfactory.fi/).
