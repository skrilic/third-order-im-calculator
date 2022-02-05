import React from "react";
import DeleteIcon from '@mui/icons-material/Delete';

function Station(props) {
    return (
        <div>
            {
                props.stationName.trim() !== "" ? 
                <div>
                    <div className="station-name-label">{props.stationName}</div>  {props.stationFrequency}MHz <span onClick={() => {
                        props.onDelete(props.id);
                    }}>
                        <DeleteIcon />
                    </span>
                </div> :
                <div>
                    <div className="station-name-label">F<sub>{props.id}</sub></div>  {props.stationFrequency}MHz <span onClick={() => {
                        props.onDelete(props.id);
                    }}>
                        <DeleteIcon />
                    </span>
                </div>
            }
        </div>
    )
}

export default Station;