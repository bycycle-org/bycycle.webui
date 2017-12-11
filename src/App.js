import React, { Component } from 'react';
import { connect } from 'react-redux';

import axios from 'axios';

import {
    setInfo,
    setMapContextMenuState,
    setMenuState
} from './actions';

import Directions from './directions';
import Map from './map';
import Menu from './Menu';
import Search from './search';
import { makeApiUrl } from './util';

import './App.css';


const INFO_URL = makeApiUrl('/info');


axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.validateStatus = status => {
    return status >= 200 && status < 400;
};


class App extends Component {
    render () {
        const props = this.props;

        return (
            <div className="App" onMouseDown={event => props.setMenuStates(false)}>
                <div className="header">
                    <div className="title">byCycle.org</div>
                </div>
                <div className="progress-bar" style={{
                    display: props.progressCounter > 0 ? 'block' : 'none'
                }}></div>
                <Menu open={false} />
                { props.function === 'directions' ? <Directions /> : <Search /> }
                <Map />
            </div>
        );
    }

    componentDidMount () {
        axios.get(INFO_URL).then(response => this.props.setInfo(response.data));
    }
}


function mapStateToProps (state) {
    return state.main;
}


function mapDispatchToProps (dispatch) {
    return {
        setInfo: info => dispatch(setInfo(info)),
        setMenuStates: open => {
            dispatch(setMenuState(open));
            dispatch(setMapContextMenuState(open));
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(App);
