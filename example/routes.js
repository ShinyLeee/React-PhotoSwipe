import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './components/App';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const routes = () => (
  <Route path="/" component={App}>
    <IndexRoute component={Home} />
    <Route path="*" component={NotFound} />
  </Route>
);

export default routes;
