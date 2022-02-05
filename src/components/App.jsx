import React, {useState} from "react";
import CreateStation from "./CreateStation";
import Station from "./Station";
import CalculateIcon from '@mui/icons-material/Calculate';
import {AgGridColumn, AgGridReact} from 'ag-grid-react';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

function App() {
  const im3Array = [];
  const [rowData, setRowData] = useState([]);
  const [stationList, setStationList] = useState([]);

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
    } else if(stationList.length === 2) {
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
    } else {
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
      var i = 0;
      stationList.forEach(station1 => {
        var j = 0;
        stationList.forEach(station2 => {
          if (j>i) {
          stationList.forEach(station3 => {
            if(station3 !== station2 && station3 !== station1) {
              im3Array.push({
                description:`${station1.name}(${station1.frequency}) + ${station2.name}(${station2.frequency}) - ${station3.name}(${station3.frequency})`,
                frequency:(parseFloat(station1.frequency) + parseFloat(station2.frequency) - parseFloat(station3.frequency)).toFixed(2)
              });
            }
          })
        }
          j++;
        })
        i++;
      })
    }
    // console.log(im3Array);
    setRowData(im3Array); 
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

      <div className="ag-theme-alpine App-im-list" style={{height: 400, width: 400}}>
           <AgGridReact
               rowData={rowData}>
               <AgGridColumn field="description" filter={ true }></AgGridColumn>
               <AgGridColumn field="frequency" sortable={ true }></AgGridColumn>
           </AgGridReact>
       </div>
    </div>
  );
}

export default App;
