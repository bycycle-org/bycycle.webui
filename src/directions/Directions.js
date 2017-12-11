import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    getDirections,
    resetDirectionsState,
    setFrom,
    setFunction,
    setTo,
    swapFromAndTo
} from '../actions';

import Result from './Result';

import './Directions.css';


class Directions extends Component {
    render() {
        const props = this.props;

        return (
            <div className="Function Directions">
                <form onSubmit={event => {
                          event.preventDefault();
                          props.onSubmit(props.from, props.to, props.selectedResult);
                      }}>
                    <div>
                        <div className="fields">
                            <div>
                                <input type="text"
                                       title="From"
                                       value={props.from}
                                       placeholder="From (type or select point on map)"
                                       onChange={event => {
                                           props.onFromChange(event.target.value);
                                       }} />
                            </div>

                            <div>
                                <input type="text"
                                       title="To"
                                       value={props.to}
                                       placeholder="To"
                                       onChange={event => {
                                           props.onToChange(event.target.value);
                                       }} />
                            </div>
                        </div>

                        <div className="swap-from-and-to">
                            <button type="button"
                                    title="Swap from and to"
                                    className="material-icons"
                                    disabled={!(props.from || props.to)}
                                    onClick={event => props.swapFromAndTo()}
                            >swap_calls</button>
                        </div>
                    </div>

                    <div className="buttons">
                        <button type="submit"
                                title="Get directions"
                                className="material-icons"
                                disabled={!(props.from && props.to)}>search</button>

                        <button type="reset"
                                title="Clear and return to search"
                                className="material-icons"
                                onClick={event => props.onReset()}>clear</button>
                    </div>
                </form>

                {props.selectedResult ? <Result result={props.selectedResult} /> : null}

                {
                    props.error ?
                        <div className="result error">
                            <div className="error-title">{props.error.title}</div>
                            <div className="error-message">
                                <p>{props.error.explanation}</p>
                                <p>{props.error.detail}</p>
                            </div>
                        </div> :
                        null
                }
            </div>
        );
    }
}


function mapStateToProps (state) {
    return state.directions;
}


function mapDispatchToProps (dispatch) {
    return {
        onFromChange: from => dispatch(setFrom(from)),
        onToChange: to => dispatch(setTo(to)),
        onReset: () => {
            dispatch(resetDirectionsState());
            dispatch(setFunction('search'));
        },
        onSubmit: () => {
            dispatch(getDirections());
        },
        swapFromAndTo () {
            dispatch(swapFromAndTo());
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(Directions);
