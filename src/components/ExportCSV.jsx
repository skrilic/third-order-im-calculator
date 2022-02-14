import { useCSVDownloader } from "react-papaparse";
import FileDownloadIcon from '@mui/icons-material/FileDownload';

function ExportCSV(props) {
    const { CSVDownloader, Type } = useCSVDownloader();
    return (
        <CSVDownloader
            type={Type.Button}
            filename={'intermodulations'}
            bom={true}
            config={{
                delimiter: ';',
            }}
            data = {props.jsonData}
        >
            <FileDownloadIcon />
        </CSVDownloader>
    )
}

export default ExportCSV;