import React, { Component } from 'react';
import { connect } from 'react-redux';

import debounce from 'lodash/debounce';

import {
    doSearch,
    resetSearchState,
    setFunction,
    setSearchTerm,
    setTo
} from '../actions';

import Result from './Result';

import './Search.css';


class Search extends Component {
    render() {
        const props = this.props;

        return (
            <div className="Function Search">
                <form onSubmit={event => {
                          event.preventDefault();
                          props.onSubmit();
                      }}>

                    <input type="text"
                           title="Enter something to search for"
                           placeholder="Type or select point on map"
                           value={props.term}
                           onChange={event => {
                               props.onChange(event.target.value);
                           }} />

                    <button type="submit"
                            title="Search"
                            className="material-icons"
                            disabled={!props.term}>search</button>

                    <button type="reset"
                            title="Clear"
                            className="material-icons hidden-xs"
                            disabled={!props.term}
                            onClick={event => props.onReset()}>close</button>

                    <button type="button"
                            title="Get directions"
                            className="material-icons"
                            onClick={event => {
                                props.setFunction('directions', props.term, props.termPoint)
                            }}
                    >directions</button>
                </form>

                {
                    props.results.length ?
                        <ul className="results">
                            {props.results.map(r => <Result key={r.id} result={r} />)}
                        </ul> :
                        null
                }

                {
                    props.error ?
                        <div className="results error">
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
    return state.search;
}


function mapDispatchToProps (dispatch) {
    const debouncedOnChange = debounce(term => {
        if (term) {
            dispatch(doSearch(true));
        } else {
            dispatch(resetSearchState());
        }
    }, 200);

    return {
        onChange: term => {
            dispatch(setSearchTerm(term));
            debouncedOnChange(term);
        },
        onReset: () => {
            dispatch(resetSearchState());
        },
        onSubmit: () => {
            dispatch(doSearch());
        },
        setFunction: (name, term, termPoint) => {
            term = term.trim();
            dispatch(resetSearchState());
            if (term) {
                dispatch(setTo(term, termPoint));
            }
            dispatch(setFunction(name));
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(Search);
