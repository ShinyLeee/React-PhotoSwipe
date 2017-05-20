/* eslint-disable global-require */
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import RootApp from './RootApp';
import routes from './routes';

const render = (AppRoute) => {
  ReactDOM.render(
    <AppContainer>
      <RootApp
        key={module.hot ? Math.random() : undefined}
        routes={AppRoute}
      />
    </AppContainer>,
    document.getElementById('app'),
  );
};

render(routes);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./routes', () => {
    const newRoutes = require('./routes').default;
    render(newRoutes);
  });
}
