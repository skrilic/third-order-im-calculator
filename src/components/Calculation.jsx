import React, { useState, useMemo } from "react";
import ExportCSV from "./ExportCSV";
import AddStation from "./AddStation";
import StationList from "./StationList";

import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const agGridStyle = { height: 290, width: 510 };


function Calculation() {

  const [rowData, setRowData] = useState([]);
  const [stationList, setStationList] = useState([]);

  const columnDefs = [
    {
      headerName: 'Description',
      field: 'description',
      valueFormatter: params => String(params.data.description),
      autoHeaderHeight: true,
      width: '350%',
      cellStyle: { textAlign: "left" }
    },
    {
      headerName: 'Frequency',
      field: 'frequency',
      valueFormatter: params => parseFloat(params.data.frequency).toFixed(2),
      autoHeaderHeight: true,
      width: '150%',
      comparator: (valueA, valueB, nodeA, nodeB, isInverted) => valueA - valueB
    }
  ];

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

      <div className="ag-theme-alpine App-im-list" style={agGridStyle}>
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={rowData}>
        </AgGridReact>
        {(rowData.length >= 1) ? <ExportCSV jsonData={rowData} /> : null}
      </div>
    </div>
  );
}

export default Calculation;
