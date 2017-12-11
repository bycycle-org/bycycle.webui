import React, { Component } from 'react';
import { connect } from 'react-redux';

import {selectSearchResult, setCenter} from '../actions';


class Result extends Component {
    render () {
        const props = this.props;
        const result = props.result;

        return (
            <li className="result" onClick={event => event.preventDefault()}>
                <a href="#select-result" onClick={() => props.onSelect(result)}>
                    {result.name}
                </a>
            </li>
        );
    }
}


function mapDispatchToProps (dispatch) {
    return {
        onSelect: (result) => {
            dispatch(selectSearchResult(result));
            dispatch(setCenter(result.geom.coordinates, undefined, true));
        }
    }
}


export default connect(undefined, mapDispatchToProps)(Result);
