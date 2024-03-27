import { useEffect } from "react";

function Im3Calculator(stationList, rowData, setRowData) {

    // const tmpIm3Array = useMemo(() => [], []);
    const tmpIm3Array = [];


    // console.log("ROW DATA: ", rowData);

    const im2FxFy = () => {
        /* 2*Fx-Fy; where x!=y */
        stationList.forEach((station1) => {
            stationList.forEach((station2) => {
                if (station2 !== station1) {
                    var imFreq = 2 * station1.frequency - station2.frequency;
                    if (imFreq > 0) {
                        tmpIm3Array.push({
                            description: `2*${station1.name}(${station1.frequency}) - ${station2.name}(${station2.frequency})`,
                            frequency: imFreq.toFixed(2)
                        });
                    }
                }
            })
        })
    }

    const imFxFyFz = () => {
        /* Fx+Fy-Fz where x!=y!=z */
        var i = 0;
        stationList.forEach(station1 => {
            var j = 0;
            stationList.forEach(station2 => {
                if (j > i) {
                    stationList.forEach(station3 => {
                        if (station3 !== station2 && station3 !== station1) {
                            var imFreq = parseFloat(station1.frequency) + parseFloat(station2.frequency) - parseFloat(station3.frequency);
                            if (imFreq > 0) {
                                tmpIm3Array.push({
                                    description: `${station1.name}(${station1.frequency}) + ${station2.name}(${station2.frequency}) - ${station3.name}(${station3.frequency})`,
                                    frequency: imFreq.toFixed(2)
                                });
                            }
                        }
                    })
                }
                j++;
            })
            i++;
        })
    }

    useEffect(() => {
        // console.log("Im3Calculator: ", rowData);
        if (stationList.length === 2) {
            /* 2*Fx-Fy; where x!=y */
            im2FxFy();
        } else if (stationList.length > 2) {
            /* 2*Fx-Fy; where x!=y */
            im2FxFy();
            /* Fx+Fy-Fz where x!=y!=z */
            imFxFyFz();
        }
        setRowData(tmpIm3Array);

    }, [stationList])

}

export default Im3Calculator