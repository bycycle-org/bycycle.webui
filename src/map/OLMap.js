import debounce from 'lodash/debounce';

import extent from 'ol/extent';
import proj from 'ol/proj';

import OLMap from 'ol/map';
import View from 'ol/view';

import BingMapsSource from 'ol/source/bingmaps';
import OSMSource from 'ol/source/osm';
import VectorSource from 'ol/source/vector';
import TileDebugSource from 'ol/source/tiledebug';
import TileWMSSource from 'ol/source/tilewms';

import TileLayer from 'ol/layer/tile';
import VectorLayer from 'ol/layer/vector'

import {
    ANIMATION_DURATION,
    DUMMY_MAP,
    MIN_ZOOM,
    MAX_ZOOM,
    NATIVE_PROJECTION,
    GEOGRAPHIC_PROJECTION
} from './const';

import {
    BOUNDARY_STYLE,
    MARKER_STYLE,
    ROUTE_END_STYLE,
    ROUTE_START_STYLE,
    ROUTE_STYLE,
    SELECTED_MARKER_STYLE
} from './styles';

import OverviewSwitcher from './OverviewSwitcher';


const BING_API_KEY = process.env.REACT_APP_BING_API_KEY;
const MAP_SERVER_URL = process.env.REACT_APP_MAP_SERVER_URL;
const MAP_SERVER_WORKSPACE = process.env.REACT_APP_MAP_SERVER_WORKSPACE;


export default class Map {
    constructor () {
        let baseLayers = [];

        if (DUMMY_MAP) {
            baseLayers = [
                this.makeWMSLayer('streets', 'Streets', null, true),
                this.makeWMSLayer('intersections', 'Intersections')
            ];
        } else {
            baseLayers = [
                this.makeBaseLayer('CanvasLight', 'Map', null, true),
                this.makeBaseLayer('AerialWithLabels', 'Satellite'),
                this.makeOSMLayer()
            ]
        }

        const overlayLayers = [
            this.makeOverlayLayer('Search Results', feature => {
                return feature.get('selected') ? SELECTED_MARKER_STYLE : MARKER_STYLE
            }),
            this.makeOverlayLayer('Directions', feature => {
                const type = feature.get('type');
                switch (type) {
                    case 'start':
                        return ROUTE_START_STYLE;
                    case 'route':
                        return ROUTE_STYLE;
                    case 'end':
                        return ROUTE_END_STYLE;
                    default:
                        throw new TypeError(`Unknown feature type: ${type}`);
                }
            }),
            this.makeOverlayLayer('Boundary', BOUNDARY_STYLE),
        ];

        const layers = [].concat(baseLayers, overlayLayers);

        const map = new OLMap({
            controls: [],
            layers: layers,
            view: new View({
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM
            })
        });

        this.baseLayers = baseLayers;
        this.baseLayer = baseLayers.find(layer => layer.getVisible());
        this.overlayLayers = overlayLayers;
        this.map = map;
        this.view = map.getView();
        this.overviewSwitcher = new OverviewSwitcher(map, baseLayers);
    }

    initialize (target, overviewMapTarget, options) {
        this.map.setTarget(target);
        this.setCenter(options.center, options.zoom);
        this.overviewSwitcher.initialize(overviewMapTarget, {
            center: this.view.getCenter(),
            zoom: 12
        });
    }

    addListener (type, listener) {
        this.map.on(type, listener);
    }

    addFeatureListener (type, callback, noFeatureCallback, onlyLayer, debounceTime) {
        const map = this.map;
        let listener = event => {
            const options = {
                layerFilter: onlyLayer ? (layer => layer === onlyLayer) : undefined
            };
            const feature = map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
                callback(feature, layer);
                return feature;
            }, options);
            if (!feature && noFeatureCallback) {
                noFeatureCallback(event);
            }
        };
        if (debounceTime) {
            listener = debounce(listener, debounceTime);
        }
        map.on(type, listener);
    }

    /* Center */

    getCenter (native = true) {
        let center = this.view.getCenter();
        if (!native) {
            center = this.transform(center);
        }
        return center;
    }

    setCenter (center, zoom, native = true, duration = ANIMATION_DURATION,
               onlyIfNotVisible = false) {
        if (!native) {
            center = this.transform(center, true);
        }

        if (onlyIfNotVisible && this.isVisible(center)) {
            return;
        }

        if (duration && duration > 0) {
            if (typeof zoom === 'undefined') {
                this.view.animate({center, duration});
            } else {
                this.view.animate({center, zoom, duration});
            }
        } else {
            this.view.setCenter(center);
            if (typeof zoom !== 'undefined') {
                this.view.setZoom(zoom);
            }
        }
    }

    getCoordinateFromPixel (pixel, native = true) {
        let coordinate = this.map.getCoordinateFromPixel(pixel);
        if (!native) {
            coordinate = this.transform(coordinate);
        }
        return coordinate;
    }

    getExtent (native = true) {
        let extent = this.view.calculateExtent();
        if (!native) {
            extent = this.transformExtent(extent);
        }
        return extent;
    }

    fitExtent (extent, native = true, options = {}, duration = ANIMATION_DURATION,
               onlyIfNotVisible = false) {
        if (!native) {
            extent = this.transformExtent(extent, true);
        }
        if (onlyIfNotVisible && this.isVisible(extent)) {
            return;
        }
        if (duration && duration > 0) {
            options.duration = duration;
        }
        this.view.fit(extent, options)
    }

    isVisible (coordinatesOrExtent) {
        const currentExtent = this.view.calculateExtent();
        const length = coordinatesOrExtent.length;
        if (length === 2) {
            return extent.containsCoordinate(currentExtent, coordinatesOrExtent);
        } else if (length === 4) {
            return extent.containsExtent(currentExtent, coordinatesOrExtent);
        }
        throw new TypeError('Expected array of length 2 (coordinates) or 4 (extent)');
    }

    /* Layers */

    makeBaseLayer (imagerySet, label, shortLabel = null, visible = false) {
        shortLabel = shortLabel || label;
        const source = new BingMapsSource({
            key: BING_API_KEY,
            imagerySet
        });
        return new TileLayer({ label, shortLabel, source, visible });
    }

    makeOSMLayer (label = 'OpenStreetMap', shortLabel = 'OSM', visible = false) {
        let source = new OSMSource();
        if (DUMMY_MAP) {
            source = new TileDebugSource({
                projection: source.getProjection(),
                tileGrid: source.getTileGrid()
            });
        }
        return new TileLayer({ label, shortLabel, source, visible });
    }
    makeWMSLayer (layerName, label, shortLabel = null, visible = false) {
        shortLabel = shortLabel || label;
        const source = new TileWMSSource({
            serverType: 'geoserver',
            url: `${MAP_SERVER_URL}/${MAP_SERVER_WORKSPACE}/wms`,
            params: {
                LAYERS: `${MAP_SERVER_WORKSPACE}:${layerName}`
            }
        });
        return new TileLayer({ label, shortLabel, source, visible });
    }

    makeOverlayLayer (label, style) {
        return new VectorLayer({
            label,
            style,
            source: new VectorSource()
        });
    }

    getBaseLayer (label) {
        if (label) {
            return this.baseLayers.find(layer => layer.get('label') === label);
        }
        return this.baseLayer;
    }

    getNextBaseLayer () {
        return this.overviewSwitcher.baseLayer;
    }

    setBaseLayer (newLayer) {
        const baseLayers = this.baseLayers;
        const numBaseLayers = baseLayers.length;

        if (typeof newLayer === 'string') {
            newLayer = baseLayers.find(layer => layer.get('label') === newLayer);
        }

        let nextLayerIndex = 0;
        baseLayers.forEach((layer, i) => {
            layer.setVisible(false);
            if (layer === newLayer) {
                nextLayerIndex = (i + 1) % numBaseLayers;
            }
        });

        this.overviewSwitcher.setBaseLayerByIndex(nextLayerIndex);

        this.baseLayer = newLayer;
        this.baseLayer.setVisible(true);
    }

    getOverlayLayer (label) {
        return this.overlayLayers.find(layer => layer.get('label') === label);
    }

    /* Transform */

    /**
     * Transform native coordinate to geographic.
     */
    transform (coordinate, reverse = false) {
        const { source, destination } = this._getTransformProjections(reverse);
        return proj.transform(coordinate, source, destination);
    }

    /**
     * Transform native extent to geographic.
     */
    transformExtent (extent, reverse = false) {
        const { source, destination } = this._getTransformProjections(reverse);
        return proj.transformExtent(extent, source, destination);
    }

    _getTransformProjections (reverse = false,
                              source = NATIVE_PROJECTION,
                              destination = GEOGRAPHIC_PROJECTION) {
        return reverse ? { source: destination, destination: source } : { source, destination };
    }

    /* Zoom */

    getZoom () {
        return this.view.getZoom();
    }

    setZoom (zoom, duration = ANIMATION_DURATION) {
        if (duration > 0) {
            this.view.animate({zoom, duration});
        } else {
            this.view.setZoom(zoom);
        }
    }

    zoomIn () {
        this.setZoom(this.getZoom() + 1);
    }

    zoomOut () {
        this.setZoom(this.getZoom() - 1);
    }
}
