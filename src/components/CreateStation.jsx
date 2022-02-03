import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";




function CreateStation(props) {
	const [station, setStation] = useState({
		name: "",
		frequency: ""
	});

	function submitStation(event) {
		setStation({
			name: "",
			frequency: ""
		});
		event.preventDefault();
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

	return (
		<form className="station-row">
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
					step=".01"
					placeholder="Trasmitting frequency (MHz)"
					onChange={handleChange}
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