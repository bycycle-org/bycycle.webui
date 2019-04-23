import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    doSearch,
    getDirections,
    resetDirectionsState,
    resetSearchState,
    setCenter,
    setFrom,
    setFunction,
    setMapContextMenuState,
    setSearchTerm,
    setTo
} from '../actions';


const OSM_BASE_URL = '//www.openstreetmap.org/#map=17/';


class ContextMenu extends Component {
    render () {
        const props = this.props;
        const map = props.map;
        const [x, y] = [props.left, props.top];
        const pixel = [x, y];
        const display = props.open ? 'block' : 'none';
        const [containerWidth, containerHeight] = props.containerDimensions;
        const threshold = 200;

        let top = `${y}px`;
        let right = 'auto';
        let bottom = 'auto';
        let left = `${x}px`;

        if ((containerWidth - x) < threshold) {
            left = 'auto';
            right = `${containerWidth - x}px`;
        }

        if ((containerHeight - y) < threshold) {
            top = 'auto';
            bottom = `${containerHeight - y}px`;
        }

        return (
            <ul className="ContextMenu"
                style={{
                    display: display,
                    top: top,
                    right: right,
                    bottom: bottom,
                    left: left,
                }}
                onClick={event => {
                    if (!event.target.classList.contains('regular-link')) {
                        event.preventDefault();
                    }
                    props.setMapContextMenuState(false);
                }}
                onContextMenu={event => event.preventDefault()}
                onMouseDown={event => event.stopPropagation()}
            >
                <li>
                    <a href="#search-here"
                       onClick={event => props.whatsHere(map, pixel)}>
                        What's here?
                    </a>
                </li>
                <li>
                    <a href="#directions-from"
                       onClick={event => props.getDirectionsFrom(map, pixel)}>
                        Get directions from
                    </a>
                </li>
                <li>
                    <a href="#directions-to"
                       onClick={event => props.getDirectionsTo(map, pixel)}>
                        Get directions to
                    </a>
                </li>
                <li>
                    <a href="#center-map"
                       onClick={event => props.centerMap(map, pixel)}>
                        Center map here
                    </a>
                </li>
                <li>
                    <a href="#zoom-in"
                       onClick={event => props.zoomIn(map, pixel, props.streetLevelZoom)}>
                        Zoom in here
                    </a>
                </li>
                <li>
                    <a href={this.osmUrl || OSM_BASE_URL} className="regular-link">
                        View on OpenStreetMap
                    </a>
                </li>
            </ul>
        );
    }

    componentWillReceiveProps (newProps) {
        if (newProps.open) {
            const pixel = [newProps.left, newProps.top];
            this.osmUrl = this.getOSMUrl(newProps.map, pixel);
        }
    }

    getOSMUrl (map, pixel) {
        const coordinates = getCoordinates(map, pixel, false, true, '/');
        return `${OSM_BASE_URL}${coordinates[2]}`;
    }
}


function getCoordinates (map, pixel, native = false, reverse = false, sep = ', ') {
    const coordinates = map.getCoordinateFromPixel(pixel, native);
    let x = coordinates[0];
    let y = coordinates[1];
    if (reverse) {
        [x, y] = [y, x];
    }
    return [x, y, `${x.toFixed(5)}${sep}${y.toFixed(5)}`];
}


function mapStateToProps (state) {
    return state.map.contextMenu;
}


function mapDispatchToProps (dispatch) {
    return {
        centerMap: (map, pixel) => {
            const center = map.getCoordinateFromPixel(pixel);
            dispatch(setCenter(center));
        },
        getDirectionsFrom: (map, pixel) => {
            const [x, y, location] = getCoordinates(map, pixel);
            dispatch(resetSearchState());
            dispatch(setFrom(location, null, [x, y]));
            dispatch(setFunction('directions'));
            dispatch(getDirections());
        },
        getDirectionsTo: (map, pixel) => {
            const [x, y, location] = getCoordinates(map, pixel);
            dispatch(resetSearchState());
            dispatch(setTo(location, null, [x, y]));
            dispatch(setFunction('directions'));
            dispatch(getDirections());
        },
        whatsHere: (map, pixel) => {
            const [x, y, location] = getCoordinates(map, pixel);
            dispatch(resetDirectionsState());
            dispatch(setFunction('query'));
            dispatch(setSearchTerm(location, null, [x, y]));
            dispatch(doSearch(false, true));
        },
        zoomIn: (map, pixel, zoom) => {
            const currentZoom = map.getZoom();
            const center = map.getCoordinateFromPixel(pixel);
            zoom = currentZoom >= zoom ? undefined : zoom;
            dispatch(setCenter(center, zoom));
        },
        setMapContextMenuState: (open, top, left) => {
            dispatch(setMapContextMenuState(open, top, left));
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
