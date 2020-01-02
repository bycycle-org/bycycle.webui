import { toLonLat } from 'ol/proj';
import { tick } from 'svelte';
import { currentLocation, progressCounter } from '../stores';

export function displayLatLong(coordinates, sep = ', ', transform = true) {
    if (transform) {
        coordinates = toLonLat(coordinates);
    }
    return `${coordinates[1].toFixed(5)}${sep}${coordinates[0].toFixed(5)}`;
}

/**
 * Wait for location to be ready.
 *
 * @param callback
 * @param showProgress
 */
export function waitForLocation(callback, showProgress = true, ...args) {
    if (showProgress) {
        progressCounter.increment();
    }
    const unsubscribe = currentLocation.subscribe(async locationData => {
        if (locationData.position || locationData.error) {
            await tick();
            unsubscribe();
            callback(locationData, ...args);
            if (showProgress) {
                progressCounter.decrement();
            }
        }
    });
}
