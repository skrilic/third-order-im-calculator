import React, { useEffect, useState } from 'react';
import Station from './Station';
import CalculateIcon from "@mui/icons-material/Calculate";
import Im3Calculator from './Im3Calculator';

function StationList(props) {
    const stationList = props.stationList;
    const setStationList = props.setStationList;

    const [rowData, setRowData] = useState([]);

    function deleteStation(stationId) {

        setStationList(prevStations => {
            return prevStations.filter((station, index) => {
                return index !== stationId;
            })
        });
        // console.log("Station list length: " + stationList.length);
        if (stationList.length <= 1) {
            setRowData([])
        };
    }

    Im3Calculator(stationList, rowData, setRowData);

    return (
        <div>
            <label>StationList</label>

            <form className="App-stations-list" onSubmit={(event) => event.preventDefault()}>
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
                {/* <button onClick={calculateIM3}><CalculateIcon /></button> */}
                <button onClick={() => console.log("calculateIM3")}><CalculateIcon /></button>
            </form>

        </div>
    )
}

export default StationList