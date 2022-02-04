import React from "react";
import DeleteIcon from '@mui/icons-material/Delete';

function Station(props) {
    return (
            <tr>
                {
                    props.stationName.trim() !== "" ? 
                    <td>{props.stationName}</td> : 
                    <td>F<sub>{props.id}</sub></td>
                }
                <td>{props.stationFrequency}</td>
                <td>
                    <button><DeleteIcon /></button>
                </td>
            </tr>
    )
}

export default Station;