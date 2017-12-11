import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import registerServiceWorker from './registerServiceWorker';

import App from './App';
import STORE from './store';

import 'material-design-icons/iconfont/material-icons.css';
import './index.css';


ReactDOM.render(
    <Provider store={STORE}>
        <App />
    </Provider>,
    document.getElementById('root')
);


registerServiceWorker();
