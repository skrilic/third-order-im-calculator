import React from "react";
import DeleteIcon from '@mui/icons-material/Delete';

function Station(props) {
    return (
        <li>
            {
                props.stationName.trim() !== "" ? 
                <div>
                    {props.stationName}  {props.stationFrequency}MHz <span onClick={() => {
                        props.onDelete(props.id);
                    }}>
                        <DeleteIcon />
                    </span>
                </div> :
                <div>
                    F<sub>{props.id}</sub>  {props.stationFrequency}MHz <span onClick={() => {
                        props.onDelete(props.id);
                    }}>
                        <DeleteIcon />
                    </span>
                </div>
                
            }
        </li>
    )
}

export default Station;