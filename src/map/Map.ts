import { Map, View } from 'ol';
import { containsCoordinate, containsExtent } from 'ol/extent';
import { transform, transformExtent } from 'ol/proj';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import GeoJSONFormat from 'ol/format/GeoJSON';
import MVTFormat from 'ol/format/MVT';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import OSMSource from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import XYZSource from 'ol/source/XYZ';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

import { makeApiUrl } from '../util';
import {
    DEBUG,
    ANIMATION_DURATION,
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    GEOGRAPHIC_PROJECTION,
    NATIVE_PROJECTION,
    MAPBOX_API_URL,
    MAPBOX_ACCESS_TOKEN,
    MY_LOCATION_ACCURACY_THRESHOLD,
    STREET_LEVEL_ZOOM
} from './const';
import { BOUNDARY_STYLE, MY_LOCATION_ACCURACY_STYLE, MY_LOCATION_STYLE } from './styles';

export default class MapService {
    private map: any;
    private view: any;
    private baseLayer: any;
    private baseLayers: any;
    private myLocationLayer: any;
    private boundaryLayer: any;
    private vectorLayer: any;
    private overlays: any[];


    constructor() {
        const baseLayers = [];
        if (DEBUG) {
            const STREET_STYLE = [
                new Style({
                    stroke: new Stroke({
                        color: '#686868',
                        width: 6
                    })
                }),
                new Style({
                    stroke: new Stroke({
                        color: '#a8a8a8',
                        width: 4
                    })
                })
            ];
            const INTERSECTION_STYLE = new Style({
                image: new Circle({
                    radius: 6,
                    stroke: new Stroke({
                        color: '#686868',
                        width: 2
                    }),
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.5)'
                    })
                })
            });
            baseLayers.push(
                new LayerGroup({
                    // label: 'Debug',
                    // shortLabel: 'Debug',
                    layers: [
                        this.makeMVTLayer('street', 'Streets', null, true, STREET_STYLE),
                        this.makeMVTLayer(
                            'intersection',
                            'Intersections',
                            null,
                            true,
                            INTERSECTION_STYLE
                        )
                    ],
                    visible: false
                })
            );
        }

        baseLayers.push(
            this.makeBaseLayer('wylee/cjpa3kgvr149r2qmism8fqrnh', 'Map'),
            this.makeBaseLayer('wylee/cjpg5l0gb5hgh2sn9p4u49gyw', 'Satellite'),
            this.makeOSMLayer()
        );

        this.baseLayers = baseLayers;

        this.myLocationLayer = new VectorLayer({
            visible: false,
            source: new VectorSource({
                features: new Collection()
            })
        });

        this.boundaryLayer = this.makeBoundaryLayer();

        this.vectorLayer = new VectorLayer({
            visible: false,
            source: new VectorSource({
                features: new Collection()
            })
        });

        this.overlays = [];

        this.view = new View({
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM
        });

        this.map = new Map({
            controls: [],
            layers: baseLayers.concat([this.myLocationLayer, this.boundaryLayer, this.vectorLayer]),
            view: this.view
        });

        this.setBaseLayer(baseLayers[0]);

        if (DEBUG) {
            this.on('click', event => {
                const baseLayers = this.baseLayers[0].get('layers').getArray();
                this.map.forEachFeatureAtPixel(
                    event.pixel,
                    feature => {
                        const layer = feature.get('layer');
                        const props = ['layer', 'id', 'name'];
                        const data = [];
                        if (layer === 'street') {
                            props.push(
                                'start_node_id',
                                'end_node_id',
                                'highway',
                                'bicycle',
                                'oneway_bicycle'
                            );
                        }
                        for (let prop of props) {
                            data.push(`${prop}: ${feature.get(prop)}`);
                        }
                        console.debug(data.join('\n'));
                    },
                    {
                        layerFilter: layer => {
                            for (let baseLayer of baseLayers) {
                                if (layer === baseLayer) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    }
                );
            });
        }
    }

    setTarget(target) {
        this.map.setTarget(target);
    }

    getSize() {
        const size = this.map.getSize();
        return size ? size : [0, 0];
    }

    /* Events */

    on(...args) {
        return this.map.on(...args);
    }

    once(...args) {
        return this.map.once(...args);
    }

    /* Layers */

    makeBaseLayer(mapboxLayerId, label, shortLabel = null, visible = false) {
        const url = [
            `${MAPBOX_API_URL}/styles/v1/${mapboxLayerId}/tiles/256/{z}/{x}/{y}`,
            `access_token=${MAPBOX_ACCESS_TOKEN}`
        ].join('?');
        const source = new XYZSource({ url });
        const layer = new TileLayer({ source, visible });
        layer.set('label', label);
        layer.set('shortLabel', shortLabel || label);
        return layer;
    }

    makeOSMLayer(label = 'OpenStreetMap', shortLabel = 'OSM', visible = false) {
        const source = new OSMSource();
        const layer = new TileLayer({ source, visible });
        layer.set('label', label);
        layer.set('shortLabel', shortLabel || label);
        return layer;
    }

    makeMVTLayer(layerName, label, shortLabel = null, visible = false, style = undefined) {
        shortLabel = shortLabel || label;
        const source = new VectorTileSource({
            format: new MVTFormat(),
            url: makeApiUrl(`map/tiles/${layerName}/{x}/{y}/{z}`)
        });
        const layer = new VectorTileLayer({ source, visible, style });
        layer.set('label', label);
        layer.set('shortLabel', shortLabel || label);
        return layer;
    }

    makeBoundaryLayer() {
        const source = new VectorSource({
            format: new GeoJSONFormat(),
            url: makeApiUrl('map/street-boundary')
        });
        return new VectorLayer({ source, style: BOUNDARY_STYLE });
    }

    setBaseLayer(layer) {
        for (let baseLayer of this.baseLayers) {
            baseLayer.setVisible(baseLayer === layer);
        }
        this.baseLayer = layer;
    }

    /* Center */

    getCenter() {
        return this.view.getCenter();
    }

    setCenter(center, zoom?, options: any = {}) {
        options.center = center;
        if (typeof zoom !== 'undefined') {
            options.zoom = zoom;
        }
        if (typeof options.duration === 'undefined') {
            options.duration = ANIMATION_DURATION;
        }
        return new Promise<void>((resolve, reject) => {
            this.view.animate(options, completed => {
                completed ? resolve() : reject();
            });
        });
    }

    setDefaultCenter() {
        return this.setCenter(DEFAULT_CENTER, DEFAULT_ZOOM);
    }

    getCoordinateFromPixel(pixel, native = true) {
        let coordinate = this.map.getCoordinateFromPixel(pixel);
        if (!native && coordinate != null) {
            coordinate = this.transform(coordinate);
        }
        return coordinate;
    }

    /* Extent */

    getExtent() {
        return this.view.calculateExtent();
    }

    fitExtent(extent, options: any = {}) {
        if (typeof options.duration === 'undefined') {
            options.duration = ANIMATION_DURATION;
        }
        return new Promise<void>((resolve, reject) => {
            options.callback = completed => {
                completed ? resolve() : reject();
            };
            this.view.fit(extent, options);
        });
    }

    isVisible(coordinatesOrExtent) {
        const currentExtent = this.view.calculateExtent();
        const length = coordinatesOrExtent.length;
        if (length === 2) {
            return containsCoordinate(currentExtent, coordinatesOrExtent);
        } else if (length === 4) {
            return containsExtent(currentExtent, coordinatesOrExtent);
        }
        throw new TypeError('Expected array of length 2 (coordinates) or 4 (extent)');
    }

    /* Zoom */

    getZoom() {
        return this.view.getZoom();
    }

    setZoom(zoom, options: any = {}) {
        options.zoom = zoom;
        if (typeof options.duration === 'undefined') {
            options.duration = ANIMATION_DURATION;
        }
        return new Promise<void>((resolve, reject) => {
            this.view.animate(options, completed => {
                completed ? resolve() : reject();
            });
        });
    }

    zoomIn() {
        return this.setZoom(this.getZoom() + 1);
    }

    zoomOut() {
        return this.setZoom(this.getZoom() - 1);
    }

    zoomToStreetLevel() {
        return this.setZoom(Math.max(STREET_LEVEL_ZOOM, this.getZoom()));
    }

    zoomToFullExtent() {
        const features = this.boundaryLayer.getSource().getFeatures();
        if (features.length) {
            const extent = features[0].getGeometry().getExtent();
            return this.fitExtent(extent, { padding: [6, 7, 6, 7] });
        }
        return this.setDefaultCenter();
    }

    /* Location */

    showMyLocation(locationData) {
        const source = this.myLocationLayer.getSource();
        const { position, accuracy, accuracyGeometry } = locationData;
        source.clear();
        if (position) {
            const feature = new Feature({
                geometry: new Point(position)
            });
            feature.setStyle(MY_LOCATION_STYLE);

            if (accuracy > MY_LOCATION_ACCURACY_THRESHOLD && accuracyGeometry) {
                const accuracyFeature = new Feature({
                    geometry: accuracyGeometry
                });
                accuracyFeature.setStyle(MY_LOCATION_ACCURACY_STYLE);
                source.addFeature(accuracyFeature);
            }

            source.addFeature(feature);
            this.myLocationLayer.setVisible(true);
        } else {
            this.myLocationLayer.setVisible(false);
        }
    }

    /* Transform */

    /**
     * Transform native coordinate to geographic or vice versa.
     *
     * @param coordinate
     * @param reverse If set, transform geographic coordinate to native
     *        instead of native to geographic.
     * @returns Transformed coordinates
     */
    transform(coordinate, reverse = false) {
        const { source, destination } = this._getTransformProjections(reverse);
        return transform(coordinate, source, destination);
    }

    /**
     * Transform native extent to geographic or vice versa.
     */
    transformExtent(extent, reverse = false) {
        const { source, destination } = this._getTransformProjections(reverse);
        return transformExtent(extent, source, destination);
    }

    _getTransformProjections(
        reverse = false,
        source = NATIVE_PROJECTION,
        destination = GEOGRAPHIC_PROJECTION
    ) {
        return reverse ? { source: destination, destination: source } : { source, destination };
    }

    /* Overlays */

    addOverlay(position, className = null, positioning = 'bottom-center', element = null) {
        if (!element) {
            element = document.createElement('DIV');
            element.classList.add('material-icons', 'map-marker');
            if (className) {
                element.classList.add(...className.split(' '));
            }
        }
        const overlay = new Overlay({ element, position, positioning, insertFirst: false });
        this.map.addOverlay(overlay);
        this.overlays.push(overlay);

        // XXX: Hack to force map redraw. Not sure why this is
        //      necessary, but overlays sometimes get added in the wrong
        //      spot (just a little off) without it.
        this.setCenter(this.getCenter());

        return overlay;
    }

    clearOverlay(overlay) {
        this.map.removeOverlay(overlay);
    }

    clearOverlays() {
        for (let overlay of this.overlays) {
            this.map.removeOverlay(overlay);
        }
        this.overlays.splice(0);
    }
}
