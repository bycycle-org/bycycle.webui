import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

export const BOUNDARY_STYLE = [
    new Style({
        stroke: new Stroke({
            color: 'rgb(48, 48, 48)',
            width: 10
        })
    }),
    new Style({
        stroke: new Stroke({
            color: 'rgb(255, 255, 255)',
            width: 6
        })
    })
];

export const MY_LOCATION_STYLE = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({
            color: 'rgba(10, 128, 255, 0.75)'
        }),
        stroke: new Stroke({
            color: 'white',
            width: 2
        })
    })
});

export const MY_LOCATION_ACCURACY_STYLE = new Style({
    fill: new Fill({
        color: 'rgba(10, 128, 255, 0.15)'
    }),
    stroke: new Stroke({
        color: 'rgba(10, 128, 255, 0.25)',
        width: 1
    })
});

export const ROUTE_STYLE = [
    new Style({
        stroke: new Stroke({
            color: 'white',
            width: 10
        })
    }),
    new Style({
        stroke: new Stroke({
            color: '#303030',
            width: 6
        })
    })
];
