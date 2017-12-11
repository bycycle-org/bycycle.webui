import Style from 'ol/style/style';
import Circle from 'ol/style/circle';
import Fill from 'ol/style/fill';
import RegularShape from 'ol/style/regularshape';
import Stroke from 'ol/style/stroke';


export const BOUNDARY_STYLE = new Style({
    stroke: new Stroke({
        color: 'gray',
        lineDash: [16, 16],
        width: 4
    })
});


export const MARKER_STYLE = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({
            color: 'rgba(0, 0, 0, 0.75)'
        }),
        stroke: new Stroke({
            color: 'white',
            width: 2
        })
    })
});


export const HOVER_MARKER_STYLE = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({
            color: 'rgba(255, 128, 0, 0.85)'
        }),
        stroke: new Stroke({
            color: 'white',
            width: 2
        })
    })
});


export const SELECTED_MARKER_STYLE = new Style({
    image: new Circle({
        radius: 10,
        fill: new Fill({
            color: 'rgba(255, 0, 0, 0.85)'
        }),
        stroke: new Stroke({
            color: 'white',
            width: 2
        })
    })
});


export const ROUTE_STYLE = new Style({
    stroke: new Stroke({
        color: 'black',
        width: 4
    })
});


export const ROUTE_START_STYLE = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({
            color: 'green'
        })
    })
});


export const ROUTE_END_STYLE = new Style({
    image: new RegularShape({
        radius: 10,
        points: 4,
        angle: Math.PI / 4,
        fill: new Fill({
            color: 'red'
        })
    })
});
