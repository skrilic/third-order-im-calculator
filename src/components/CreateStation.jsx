import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";


function CreateStation(props) {
	const [station, setStation] = useState({
		name: "",
		frequency: ""
	});

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

	function handleSubmit(event) {
		event.preventDefault();
	}

	return (
		<form className="station-row" onSubmit={handleSubmit}>
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
				<button onClick={() => {
					props.onAdd(station);
					setStation({name: "", frequency: ""});
				}}>
					<AddIcon />
				</button>
			</span>
		</form>
		);
}

export default CreateStation;