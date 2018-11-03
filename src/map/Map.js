import React, { Component } from 'react';
import { connect } from 'react-redux';

import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';

import {
    selectSearchResult,
    setBaseLayer,
    setCenter,
    setMapContextMenuState,
    setMapState,
    setMenuState,
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFullExtent
} from '../actions';

import { ANIMATION_DURATION, STREET_LEVEL_ZOOM } from './const';
import ContextMenu from './ContextMenu';
import OLMap from './OLMap';
import { HOVER_MARKER_STYLE, MARKER_STYLE } from "./styles";

import './Map.css';


class Map extends Component {
    constructor (props) {
        super(props);
        this.map = new OLMap();
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.disableContextMenu = this.disableContextMenu.bind(this);
    }

    render() {
        const map = this.map;
        const props = this.props;
        const nextBaseLayer = map.getNextBaseLayer().get('label');
        const mapRef = this.refs.map;
        const dimensions = mapRef ? [mapRef.clientWidth, mapRef.clientHeight] : [0, 0];

        return (
            <div className="Map"
                 ref="map"
                 onContextMenu={this.handleContextMenu}>
                <div className="controls bottom-right column"
                     ref="bottomRight"
                     onContextMenu={this.disableContextMenu}>
                    <button title="Zoom to full extent"
                            className="material-icons"
                            onClick={props.zoomToFullExtent}>public</button>
                    <button title="Zoom in"
                            className="material-icons"
                            onClick={props.zoomIn}>add</button>
                    <button title="Zoom out"
                            className="material-icons"
                            onClick={props.zoomOut}>remove</button>
                </div>

                <div title={`Show ${nextBaseLayer} layer`}
                     className="controls bottom-left column"
                     ref="bottomLeft"
                     onClick={event => props.setBaseLayer(nextBaseLayer)}
                     onContextMenu={this.disableContextMenu}>
                    <div className="label">{nextBaseLayer}</div>
                </div>

                <ContextMenu map={map}
                             containerDimensions={dimensions}
                             streetLevelZoom={STREET_LEVEL_ZOOM}
                />
            </div>
        );
    }

    componentDidMount () {
        const map = this.map;
        const props = this.props;
        const refs = this.refs;
        const markerLayer = map.getOverlayLayer('Search Results');
        const markerSource = markerLayer.getSource();

        // Necessary because the OL map swallows click events.
        map.addListener('click', event => props.setMenuStates(false));

        map.addFeatureListener(
            'singleclick',
            feature => {
                props.selectSearchResult(feature.get('result'));
            },
            undefined,
            markerLayer
        );

        map.addFeatureListener(
            'pointermove',
            feature => {
                if (!feature.get('selected')) {
                    feature.setStyle(HOVER_MARKER_STYLE);
                }
            },
            event => {
                const features = markerSource.getFeatures();
                for (let feature of features) {
                    if (!feature.get('selected')) {
                        feature.setStyle(MARKER_STYLE)
                    }
                }
            },
            markerLayer,
            10  /* debounce */
        );

        // This keeps the Redux map state in sync with changes made to
        // the map via its internal interactions (panning, scroll-wheel
        // zooming, etc).
        map.addListener('moveend', event => {
            props.setMapState({
                center: map.getCenter(),
                extent: map.getExtent(),
                zoom: map.getZoom()
            });
        });

        map.initialize(refs.map, refs.bottomLeft, props);
    }

    componentWillReceiveProps (newProps) {
        const map = this.map;
        const props = this.props;

        // Current

        const searchResults = props.search.results;
        const selectedSearchResult = props.search.selectedResult;
        const selectedSearchResultId = selectedSearchResult ? selectedSearchResult.id : null;

        const selectedDirectionsResult = props.directions.selectedResult;
        const selectedDirectionsResultId = selectedDirectionsResult ? selectedDirectionsResult.id : null;

        const center = map.getCenter();
        const extent = map.getExtent();
        const zoom = map.getZoom();

        const searchResultsLayer = map.getOverlayLayer('Search Results');
        const searchResultsSource = searchResultsLayer.getSource();

        const directionsResultsLayer = map.getOverlayLayer('Directions');
        const directionsResultsSource = directionsResultsLayer.getSource();

        // New

        const newSearchResults = newProps.search.results;
        const newSelectedSearchResult = newProps.search.selectedResult;

        const newSelectedDirectionsResult = newProps.directions.selectedResult;

        const newCenter = newProps.center;
        const newExtent = newProps.extent;
        const newZoom = newProps.zoom;
        const onlyIfNotVisible = newProps.onlyIfNotVisible;

        if (newProps.baseLayer !== props.baseLayer) {
            map.setBaseLayer(newProps.baseLayer);
        }

        if (!isEqual(newCenter, center) && newCenter) {
            map.setCenter(newCenter, newProps.zoom, undefined, undefined, onlyIfNotVisible);
        } else if (!isEqual(newExtent, extent) && newExtent) {
            map.fitExtent(newExtent, undefined, undefined, undefined, onlyIfNotVisible);
        } else if (newZoom !== zoom) {
            map.setZoom(newZoom);
        }

        if (newSearchResults.length) {
            const searchResultIds = searchResults.map(r => r.id);
            const newSearchResultIds = newSearchResults.map(r => r.id);
            directionsResultsSource.clear(true);
            if (!isEqual(newSearchResultIds, searchResultIds)) {
                let features = [];
                for (let result of newSearchResults) {
                    features.push(new Feature({
                        geometry: new Point(result.geom.coordinates),
                        result: result,
                        properties: {
                            name: result.name
                        }
                    }));
                }
                searchResultsSource.clear(true);
                searchResultsSource.addFeatures(features);
            }
        } else if (newSelectedSearchResult) {
            directionsResultsSource.clear(true);
            if (newSelectedSearchResult.id !== selectedSearchResultId) {
                searchResultsSource.clear();
                searchResultsSource.addFeature(new Feature({
                    geometry: new Point(newSelectedSearchResult.geom.coordinates),
                    result: newSelectedSearchResult,
                    selected: true,
                    properties: {
                        name: newSelectedSearchResult.name
                    }
                }));
            }
        } else if (newSelectedDirectionsResult) {
            searchResultsSource.clear(true);
            if (newSelectedDirectionsResult.id !== selectedDirectionsResultId) {
                const start = newSelectedDirectionsResult.start;
                const end = newSelectedDirectionsResult.end;
                const linestring = newSelectedDirectionsResult.linestring;
                const coordinates = linestring.coordinates;

                const features = [
                    new Feature({
                        geometry: new Point(start.geom.coordinates),
                        type: 'start',
                        properties: {
                            name: start.name
                        }
                    }),

                    new Feature({
                        geometry: new LineString(coordinates),
                        type: 'route',
                        properties: {
                            name: newSelectedDirectionsResult.name
                        }
                    }),

                    new Feature({
                        geometry: new Point(end.geom.coordinates),
                        type: 'end',
                        properties: {
                            name: end.name
                        }
                    }),
                ];

                directionsResultsSource.clear(true);
                directionsResultsSource.addFeatures(features);
            }
        } else {
            searchResultsSource.clear(true);
            directionsResultsSource.clear(true);
        }

        if (!isEqual(newProps.info.boundary, props.info.boundary)) {
            const boundaryLine = new LineString(newProps.info.boundary);
            const boundaryFeature = new Feature({ geometry: boundaryLine });
            const layer = this.map.getOverlayLayer('Boundary');
            layer.getSource().addFeature(boundaryFeature);
        }
    }

    handleContextMenu (event) {
        event.preventDefault();
        const top = event.pageY;
        const left = event.pageX;
        this.props.setMenuState(false);
        this.props.setMapContextMenuState(true, top, left);
    }

    disableContextMenu (event) {
        event.preventDefault();
        event.stopPropagation();
    }
}


function mapStateToProps (state) {
    return {
        ...state.map,
        info: state.main.info,
        search: state.search,
        directions: state.directions
    }
}


function mapDispatchToProps (dispatch) {
    const debouncedZoomIn = debounce(() => {
        dispatch(zoomIn());
    }, ANIMATION_DURATION);

    const debouncedZoomOut = debounce(() => {
        dispatch(zoomOut());
    }, ANIMATION_DURATION);

    return {
        zoomIn: () => debouncedZoomIn(),
        zoomOut: () => debouncedZoomOut(),
        zoomToFullExtent: () => dispatch(zoomToFullExtent()),
        setBaseLayer: label => dispatch(setBaseLayer(label)),
        setCenter: center => dispatch(setCenter(center)),
        setMapState: state => dispatch(setMapState(state)),
        setMenuState: open => dispatch(setMenuState(open)),
        setMenuStates: open => {
            dispatch(setMenuState(open));
            dispatch(setMapContextMenuState(open));
        },
        setMapContextMenuState: (open, top, left) => {
            dispatch(setMapContextMenuState(open, top, left));
        },
        setZoom: zoom => dispatch(setZoom(zoom)),
        selectSearchResult: result => dispatch(selectSearchResult(result))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(Map);
