import React from "react";
import CreateStation from "./CreateStation";

function App() {

  function addStation(newStation) {
    return
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <CreateStation onAdd={addStation}/>
    </div>
  );
}

export default App;
