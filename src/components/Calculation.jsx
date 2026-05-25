import React, { useState, useMemo } from "react";
import ExportCSV from "./ExportCSV";
import AddStation from "./AddStation";
import StationList from "./StationList";

import { AgGridReact } from 'ag-grid-react';
import { themeAlpine } from 'ag-grid-community';

const agGridStyle = { height: 290, width: 510 };


function Calculation() {

  const [rowData, setRowData] = useState([]);
  const [stationList, setStationList] = useState([]);

  const columnDefs = useMemo(() => [
    {
      headerName: 'Description',
      field: 'description',
      valueFormatter: params => params.value ? String(params.value) : '',
      autoHeaderHeight: true,
      width: 350,
      cellStyle: { textAlign: "left" }
    },
    {
      headerName: 'Frequency',
      field: 'frequency',
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '',
      autoHeaderHeight: true,
      width: 150,
      comparator: (valueA, valueB, nodeA, nodeB, isInverted) => valueA - valueB
    }
  ], []);

  const defaultColDef = useMemo(() => {
    return {
      filter: true,
      cellStyle: { color: '#4F5154' },
    };
  }, []);

  return (
    <div className="App">
      <AddStation setStationList={setStationList} />

      <StationList
        stationList={stationList}
        setStationList={setStationList}
        rowData={rowData}
        setRowData={setRowData}
      />

      <div className="App-im-list" style={agGridStyle}>
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={rowData}
          theme={themeAlpine}>
        </AgGridReact>
        {(rowData.length >= 1) ? <ExportCSV jsonData={rowData} /> : null}
      </div>
    </div>
  );
}

export default Calculation;
