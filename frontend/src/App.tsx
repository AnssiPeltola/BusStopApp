import { useEffect, useState } from "react";
import axios from "axios";
import StopsList from "./components/StopsList";
import Departures from "./components/Departures";
import RealtimeDepartures from "./components/RealtimeDepartures";
import CentrumDepartures from "./components/CentrumDepartures";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/")
      .then((response) => setMessage(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="App">
      <h1>BusStopApp</h1>
      <p>{message}</p>
      <h1 className="text-2xl font-bold text-center my-4">
        Tampereen joukkoliikenne
      </h1>
      <Departures />
      <p> ---------</p>
      <RealtimeDepartures />
      <p> ---------</p>
      <CentrumDepartures />
    </div>
  );
}

export default App;
