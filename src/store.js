import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import appReducer from './reducers';


const STORE = createStore(appReducer, applyMiddleware(thunkMiddleware));


export default STORE;
