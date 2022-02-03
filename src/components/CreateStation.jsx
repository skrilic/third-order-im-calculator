import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";




function CreateStation() {
	const [station, setStation] = useState({
		name: "",
		frequency: ""
	});

	function submitStation(event) {
		setStation({
			name: "",
			frequency: ""
		});
	}

	return (
		<form className="station-row">
			<span >
				<input 
					id="stationName" 
					name="stationName" 
					type="text" 
					placeholder="Station name"
					value={station.name}
				/>
				<input 
					id="stationFrequency" 
					name="stationName" 
					type="number"
					step=".01"
					placeholder="Trasmitting frequency (MHz)"
					value={station.frequency}
				/>
				<button onClick={submitStation}>
					<AddIcon />
				</button>
			</span>
		</form>
		);
}

export default CreateStation;