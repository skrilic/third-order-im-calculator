import React, { useState } from 'react';
import AddIcon from "@mui/icons-material/Add";

function AddStation(props) {
    const setStationList = props.setStationList;

    const [station, setStation] = useState({
        name: "",
        frequency: ""
    });

    function addStation() {
        if (station.frequency.toString().trim() === "") {
            return;
        }

        setStationList(prevStations => {
            return [...prevStations, station];
        });
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setStation((prevStation) => {
            return {
                ...prevStation,
                [name]: value
            };
        });
    }

    function checkPositive(event) {
        if (event.target.value < 0) {
            event.target.value = "";
        }
    }

    return (
        <form className="station-row" onSubmit={(event) => event.preventDefault()}>
            <span >
                <input
                    name="name"
                    type="text"
                    placeholder="Station name"
                    onChange={handleChange}
                    value={station.name}
                />
                <input
                    name="frequency"
                    type="number"
                    min="0"
                    step=".01"
                    onInput={checkPositive}
                    placeholder="Trasmitting frequency"
                    onChange={handleChange}
                    value={station.frequency}
                />
                <button onClick={() => addStation()}>
                    <AddIcon />
                </button>
            </span>
        </form>
    )
}

export default AddStation