import Geolocation from 'ol/Geolocation';
import { unByKey } from 'ol/Observable';
import { readable, writable } from 'svelte/store';
import { NATIVE_PROJECTION } from './const';

export const contextMenuStore = writable({ open: false, x: 0, y: 0 });

export const locationStore = readable(
    {
        position: null,
        accuracy: Infinity,
        accuracyGeometry: null,
        heading: null,
        speed: 0,
        errorMessage: null
    },
    set => {
        const geolocation = new Geolocation({
            projection: NATIVE_PROJECTION,
            trackingOptions: {
                maximumAge: 2 * 1000,
                enableHighAccuracy: true,
                timeout: 30 * 1000
            }
        });

        const changeKey = geolocation.on('change', () => {
            set({
                position: geolocation.getPosition(),
                accuracy: geolocation.getAccuracy(),
                accuracyGeometry: geolocation.getAccuracyGeometry(),
                heading: geolocation.getHeading() || 0,
                speed: geolocation.getSpeed() || 0,
                errorMessage: null
            });
        });

        const errorKey = geolocation.on('error', error => {
            let errorMessage;
            switch (error.code) {
                case 1:
                    errorMessage = 'Access to location services have been blocked for this site.';
                    break;
                case 3:
                    errorMessage = 'Could not find location after 30 seconds.';
                    break;
                default:
                    errorMessage = 'Could not determine location.';
            }
            return {
                position: null,
                accuracy: Infinity,
                accuracyGeometry: null,
                heading: null,
                speed: 0,
                errorMessage
            };
        });

        geolocation.setTracking(true);

        return () => {
            geolocation.setTracking(false);
            unByKey(changeKey);
            unByKey(errorKey);
        };
    }
);
