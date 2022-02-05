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
  const im3Array = [];
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

  function calculateIM3() {
    
    if (stationList.length <= 1) {
      alert("Please, add at least two stations on the list!");
    } else {
      // alert("There are more than one station in the array!");
      /* 2*Fx-Fy; where x!=y */
      stationList.forEach((station1) => {
        stationList.forEach((station2) => {
          if (station2 !== station1) {
            im3Array.push({
              description:`2*${station1.name}(${station1.frequency}) - ${station2.name}(${station2.frequency})`,
              frequency:(2*station1.frequency - station2.frequency).toFixed(2)
            });
          }
      })
    })
       /* Fx+Fy-Fzwhere x!=y!=z */
    }
    console.log(im3Array);   
  }

  return (
    <div className="App">
      <CreateStation onAdd={addStation}/>
      <form className="App-stations-list" onSubmit={handleSubmit}>
      <ul>
        {stationList.map((station, index) => {
          return (
              (station.frequency.toString().trim() !== "") ?
              <li key={index}>
                <Station 
                // key={index}
                id={index}
                stationName={station.name}
                stationFrequency={station.frequency}
                onDelete={deleteStation}
                />
              </li> : null
            )
        })}
      </ul>
      <button onClick={calculateIM3}><CalculateIcon /></button>
      </form>
    </div>
  );
}

export default App;
