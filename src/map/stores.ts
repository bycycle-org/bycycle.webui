import Geolocation from 'ol/Geolocation';
import { unByKey } from 'ol/Observable';
import { readable } from 'svelte/store';
import { NATIVE_PROJECTION } from './const';

export const currentLocation = readable(
    {
        position: null,
        accuracy: Infinity,
        accuracyGeometry: null,
        heading: null,
        speed: 0,
        error: null
    },
    set => {
        const timeoutSeconds = 10;
        const geolocation = new Geolocation({
            projection: NATIVE_PROJECTION,
            trackingOptions: {
                maximumAge: 2 * 1000,
                enableHighAccuracy: true,
                timeout: timeoutSeconds * 1000
            }
        });

        const changeKey = geolocation.on('change', () => {
            set({
                position: geolocation.getPosition(),
                accuracy: geolocation.getAccuracy(),
                accuracyGeometry: geolocation.getAccuracyGeometry(),
                heading: geolocation.getHeading() || 0,
                speed: geolocation.getSpeed() || 0,
                error: null
            });
        });

        const errorKey = geolocation.on('error', error => {
            let detail;

            switch (error.code) {
                case 1:
                    detail =
                        'You may need to enable location services for this site in your browser.';
                    break;
                case 3:
                    detail = `Could not find location after ${timeoutSeconds} seconds.`;
                    geolocation.setTracking(true);
                    break;
                default:
                    detail = 'Could not determine location.';
            }

            set({
                position: null,
                accuracy: Infinity,
                accuracyGeometry: null,
                heading: null,
                speed: 0,
                error: {
                    title: 'Location Unavailable',
                    explanation: 'Your location is currently unavailable',
                    detail
                }
            });
        });

        geolocation.setTracking(true);

        return () => {
            geolocation.setTracking(false);
            unByKey(changeKey);
            unByKey(errorKey);
        };
    }
);
