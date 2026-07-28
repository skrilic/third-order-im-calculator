function stationLabel(station, index) {
  const name = station.name?.trim();
  return name || `F${index}`;
}

function stationDescription(station, index) {
  return `${stationLabel(station, index)}(${station.frequency})`;
}

function createResult(description, frequency) {
  return {
    description,
    frequency: frequency.toFixed(2)
  };
}

export function calculateIm3(stations) {
  if (stations.length < 2) {
    return [];
  }

  const results = [];

  for (let x = 0; x < stations.length; x += 1) {
    for (let y = 0; y < stations.length; y += 1) {
      if (x === y) {
        continue;
      }

      const frequency =
        2 * Number(stations[x].frequency) - Number(stations[y].frequency);

      if (frequency > 0) {
        results.push(
          createResult(
            `2*${stationDescription(stations[x], x)} - ${stationDescription(stations[y], y)}`,
            frequency
          )
        );
      }
    }
  }

  if (stations.length < 3) {
    return results;
  }

  for (let x = 0; x < stations.length; x += 1) {
    for (let y = x + 1; y < stations.length; y += 1) {
      for (let z = 0; z < stations.length; z += 1) {
        if (z === x || z === y) {
          continue;
        }

        const frequency =
          Number(stations[x].frequency) +
          Number(stations[y].frequency) -
          Number(stations[z].frequency);

        if (frequency > 0) {
          results.push(
            createResult(
              `${stationDescription(stations[x], x)} + ${stationDescription(stations[y], y)} - ${stationDescription(stations[z], z)}`,
              frequency
            )
          );
        }
      }
    }
  }

  return results;
}

export { stationLabel };
