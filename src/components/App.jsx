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

  function deleteStation(stationId) {

    setStationList(prevStations => {
      return prevStations.filter((station, index) => {
        return index !== stationId;
      })
    });
  }


  function handleSubmit(event) {
		event.preventDefault();
	}

  return (
    <div className="App">
      <CreateStation onAdd={addStation}/>
      <form className="App-stations-list" onSubmit={handleSubmit}>
      <ul>
        {stationList.map((station, index) => {
          return (
              (station.frequency.toString().trim() !== "") ?
              <Station 
                key={index}
                id={index}
                stationName={station.name}
                stationFrequency={station.frequency}
                onDelete={deleteStation}
              /> : null
            )
        })}
      </ul>
      <button><CalculateIcon /></button>
      </form>
    </div>
  );
}

export default App;
