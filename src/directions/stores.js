import { writable } from 'svelte/store';

export const directionsFromTerm = writable('');
export const directionsFromPoint = writable(null);
export const directionsToTerm = writable('');
export const directionsToPoint = writable(null);
export const directionsResults = writable([]);
export const directionsError = writable(null);

export const setDirectionsState = (state = {}) => {
    const { fromTerm, fromPoint, toTerm, toPoint, results, error } = state;
    directionsFromTerm.set(fromTerm || '');
    directionsFromPoint.set(fromPoint || null);
    directionsToTerm.set(toTerm || '');
    directionsToPoint.set(toPoint || null);
    directionsResults.set(results || []);
    directionsError.set(error || null);
};
