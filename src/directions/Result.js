import React, { Component } from 'react';
import { connect } from 'react-redux';

import capitalize from 'lodash/capitalize';

import { selectDirectionsResult, setCenter, setExtent } from '../actions';


class Result extends Component {
    render () {
        const props = this.props;
        const result = props.result;

        return (
            <ul className="result directions">
                <li className="direction start" onClick={event => {
                    event.preventDefault();
                    props.setCenter(result.start.geom.coordinates);
                }}>
                    <a href="show-direction">
                        <span className="direction-turn">Start</span>
                        <span className="direction-name">{result.start.name}</span>
                    </a>
                </li>

                {
                    result.directions.map((direction, i) => {
                        return (
                            <li className="direction"
                                key={i}
                                onClick={event => {
                                    event.preventDefault();
                                    props.setCenter(direction.start_point);
                                }}
                            >
                                <a href="#show-direction">
                                    {
                                        i === 0 ?
                                            <span className="direction-first">
                                                {this.getIconForTurn(direction.turn)}
                                            </span>
                                            :
                                            <span className="material-icons direction-turn">
                                                {this.getIconForTurn(direction.turn)}
                                            </span>
                                    }

                                    <span className="direction-name">
                                        {direction.display_name}
                                        {i === 0 && direction.toward ?
                                            ` toward ${direction.toward}` :
                                            null}
                                    </span>

                                    <span>
                                        {this.getArchaicDistance(direction.distance)}/
                                        {this.getMetricDistance(direction.distance)}
                                    </span>
                                </a>
                            </li>
                        );
                    })
                }

                <li className="direction end" onClick={event => {
                    event.preventDefault();
                    props.setCenter(result.end.geom.coordinates);
                }}>
                    <a href="show-direction">
                        <span className="direction-turn">End</span>
                        <span className="direction-name">{result.end.name}</span>
                        <span>
                            {this.getArchaicDistance(result.distance)}/
                            {this.getMetricDistance(result.distance)}
                        </span>
                    </a>
                </li>

                <li className="info">
                    <div>
                        <p>
                            <b>Disclaimer</b>: As you are riding, please keep in mind that you
                            don't have to follow the suggested route. It may not be safe at any
                            given point. If you see what looks like an unsafe or undesirable
                            stretch in the suggested route, you can walk, ride on the sidewalk, or
                            go a different way.
                        </p>

                        <p>
                            Users should independently verify all information presented here. This
                            service is provided AS IS with NO WARRANTY of any kind. Please be
                            careful out there.
                        </p>
                    </div>
                </li>
            </ul>
        );
    }

    getArchaicDistance (distance) {
        return (
            distance.feet <= 300 ?
                `${distance.feet.toFixed(1)}ft` :
                `${distance.miles.toFixed(1)}mi`
        );
    }

    getMetricDistance (distance) {
        return (
            distance.meters <= 100 ?
                `${distance.meters.toFixed(1)}m` :
                `${distance.kilometers.toFixed(1)}km`
        );
    }

    getIconForTurn (turn) {
        switch (turn) {
            case 'straight':
                return 'keyboard_arrow_up';
            case 'back':
                return 'keyboard_arrow_down';
            case 'left':
            case 'right':
                return `keyboard_arrow_${turn}`;
            case 'north':
            case 'east':
            case 'south':
            case 'west':
                return capitalize(turn.charAt(0));
            case 'northeast':
            case 'southeast':
            case 'southwest':
            case 'northwest':
                return `${turn.charAt(0)}${turn.charAt(5)}`.toUpperCase();
            default:
                return turn;
        }
    }
}


function mapDispatchToProps (dispatch) {
    return {
        onSelect: result => {
            dispatch(selectDirectionsResult(result));
            dispatch(setExtent(result.bounds, true));
        },
        setCenter: center => {
            dispatch(setCenter(center));
        }
    }
}


export default connect(undefined, mapDispatchToProps)(Result);
