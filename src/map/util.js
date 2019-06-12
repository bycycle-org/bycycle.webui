import { toLonLat } from 'ol/proj';

export function displayLatLong(coordinates, sep = ', ', transform = true) {
    if (transform) {
        coordinates = toLonLat(coordinates);
    }
    return `${coordinates[1].toFixed(5)}${sep}${coordinates[0].toFixed(5)}`;
}
