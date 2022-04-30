import React, { useState } from "react";
import CreateStation from "./CreateStation";
import Station from "./Station";
import CalculateIcon from '@mui/icons-material/Calculate';
import ExportCSV from "./ExportCSV";

import { AgGridColumn, AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const agGridStyle = {height: 290, width: 480};


function Calculation() {
  const im3Array = [];
  const [rowData, setRowData] = useState([]);
  const [stationList, setStationList] = useState([]);

  function addStation(newStation) {
    if (newStation.frequency.toString().trim() === "") {
      return;
    }
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
    console.log("Station list length: " + stationList.length);
    if (stationList.length <= 1) {
      setRowData([])
    };
  }


  function handleSubmit(event) {
		event.preventDefault();
	}

  function im2FxFy() {
    /* 2*Fx-Fy; where x!=y */
    stationList.forEach((station1) => {
      stationList.forEach((station2) => {
        if (station2 !== station1) {
          var imFreq = 2*station1.frequency - station2.frequency;
          if (imFreq > 0) {
            im3Array.push({
              description:`2*${station1.name}(${station1.frequency}) - ${station2.name}(${station2.frequency})`,
              frequency:imFreq.toFixed(2)
            });
          }
        }
      })
    })
  }

  function imFxFyFz() {
    /* Fx+Fy-Fz where x!=y!=z */
    var i = 0;
    stationList.forEach(station1 => {
      var j = 0;
      stationList.forEach(station2 => {
        if (j>i) {
        stationList.forEach(station3 => {
          if(station3 !== station2 && station3 !== station1) {
            var imFreq = parseFloat(station1.frequency) + parseFloat(station2.frequency) - parseFloat(station3.frequency);
            if (imFreq > 0) {
              im3Array.push({
              description:`${station1.name}(${station1.frequency}) + ${station2.name}(${station2.frequency}) - ${station3.name}(${station3.frequency})`,
              frequency:imFreq.toFixed(2)
            });
          }
          }
        })
      }
        j++;
      })
      i++;
    })
  }


  function calculateIM3() {
    
    if (stationList.length <= 1) {
      alert("Please, add at least two stations on the list!");
    } else if(stationList.length === 2) {
      /* 2*Fx-Fy; where x!=y */
      im2FxFy();
    } else {
      /* 2*Fx-Fy; where x!=y */
      im2FxFy();
      /* Fx+Fy-Fz where x!=y!=z */
      imFxFyFz();
    }
    setRowData(im3Array); 
  }

  const freqComparator = (valueA, valueB, nodeA, nodeB, isInverted) => valueA - valueB;
  
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


      <div className="ag-theme-alpine App-im-list" style={agGridStyle}>       
           <AgGridReact
               rowData={rowData}>
               <AgGridColumn 
                field="description"
                resizable={ true } 
                sortable={ true } 
                filter={ true }
               >
               </AgGridColumn>
               
               <AgGridColumn 
                field="frequency" 
                // headerName="Freq" 
                type="numericColumn" 
                comparator={freqComparator}
                sortable={ true } 
                filter={ true }
               >
               </AgGridColumn>
           </AgGridReact>
           {(rowData.length >= 1) ? <ExportCSV jsonData={rowData} /> : null}
       </div>
    </div>
  );
}

export default Calculation;
