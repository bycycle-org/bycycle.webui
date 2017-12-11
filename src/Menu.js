import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setBaseLayer, setMapContextMenuState, setMenuState } from './actions';

import './Menu.css';
import { BASE_LAYER_LABELS } from './map';


class Menu extends Component {
    render () {
        const props = this.props;

        return (
            <div className="Menu" onMouseDown={event => event.stopPropagation()}>
                <button type="button"
                        title={props.menuOpen ? 'Hide menu' : 'Show menu'}
                        className="material-icons"
                        onClick={event => props.setMenuState()}
                >
                    {props.menuOpen ? 'close' : 'menu'}
                </button>

                <ul className="menu"
                    ref="menu"
                    onClick={event => {
                        let target = event.target;
                        while (target.tagName !== 'A') {
                            target = target.parentNode;
                            if (target === this.refs.menu) {
                                return false;
                            }
                        }
                        if (!target.classList.contains('regular-link')) {
                            event.preventDefault();
                        }
                        props.setMenuState(false);
                    }}
                    style={{
                        display: props.menuOpen ? 'block' : 'none'
                    }}
                >
                    <li className="title">
                        byCycle.org
                    </li>

                    {BASE_LAYER_LABELS.map(label => {
                        return (
                            <li key={label}>{
                                label === props.baseLayer ?
                                    <span>
                                        <span className="material-icons">layers</span>
                                        <span>{label}</span>
                                    </span> :

                                    <a href="#switch-base-layer"
                                       onClick={event => props.setBaseLayer(label)}>
                                        <span className="material-icons">layers</span>
                                        <span>{label}</span>
                                    </a>
                            }</li>
                        );
                    })}

                    <li>
                        <a href="//info.bycycle.org/" className="regular-link">
                            <span className="material-icons">notifications</span>
                            <span>News</span>
                        </a>
                    </li>

                    <li>
                        <a href="//info.bycycle.org/about" className="regular-link">
                            <span className="material-icons">info</span>
                            <span>About</span>
                        </a>
                    </li>

                    <li>
                        <a href="//info.bycycle.org/code" className="regular-link">
                            <span className="material-icons">code</span>
                            <span>Code</span>
                        </a>
                    </li>

                    <li className="info">
                        <div>
                            <p>
                                byCycle.org is an <b>experiment</b> in
                                using <a href="//openstreetmap.org">OpenStreetMap</a> data for
                                routing and geocoding. Search results and directions may be
                                inaccurate or unsuitable. All information presented on this site
                                should be verified via other sources.
                            </p>

                            <p>
                                &copy; 2004-2007,2012,2014,2017 byCycle.org
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
        );
    }
}


function mapStateToProps (state) {
    return {
        ...state.main,
        ...state.map
    }
}


function mapDispatchToProps (dispatch) {
    return {
        setBaseLayer: label => {
            dispatch(setBaseLayer(label));
        },
        setMenuState: open => {
            dispatch(setMenuState(open));
            dispatch(setMapContextMenuState(false));
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(Menu);
