import React, {useState} from "react";
import CreateStation from "./CreateStation";
import Station from "./Station";
import CalculateIcon from '@mui/icons-material/Calculate';

function App() {
  // const [stationList, setStationList] = useState(
  //     [
  //       {name: "FM1", frequency: 90.00}, 
  //       {name: "FM2", frequency: 94.60}
  //     ]
  //   );
  const [stationList, setStationList] = useState(
    []
  );

  function addStation(newStation) {
    setStationList(prevStations => {
      return [...prevStations, newStation];
    });
  }

  function handleSubmit(event) {
		event.preventDefault();
	}

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <CreateStation onAdd={addStation}/>
      <form onSubmit={handleSubmit}>
      <table id="stations">
        <tbody>
        <tr><th></th><th></th><th></th></tr>
        {stationList.map((station, index) => {
          return (
              (station.frequency.toString().trim() !== "") ?
              <Station 
                key={index}
                id={index}
                stationName={station.name}
                stationFrequency={station.frequency}
              /> : null
            )
        })}
        </tbody>
      </table>
      <button><CalculateIcon /></button>
      </form>
    </div>
  );
}

export default App;
