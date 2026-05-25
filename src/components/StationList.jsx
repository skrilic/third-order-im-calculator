import Station from './Station';
import useIm3Calculator from './Im3Calculator';

function StationList(props) {
    const stationList = props.stationList;
    const setStationList = props.setStationList;
    const rowData = props.rowData;
    const setRowData = props.setRowData;

    useIm3Calculator(stationList, setRowData);

    function deleteStation(stationId) {

        setStationList(prevStations => {
            return prevStations.filter((station, index) => {
                return index !== stationId;
            })
        });

        if (stationList.length <= 1) {
            setRowData([])
        };
    }

    // console.log("ROW DATA (station list): ", rowData);
    return (
        <div>

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
            </form>

        </div>
    )
}

export default StationList