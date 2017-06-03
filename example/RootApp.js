import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';

const RootApp = ({ routes }) => (
  <Router>
    <div>
      <header>
        <h1>React-PhotoSwipe</h1>
        <small>Pure react image gallery component for mobile device, inspired by&nbsp;
          <a href="http://photoswipe.com/" target="_blank" rel="noopener noreferrer">PhotoSwipe</a>
        </small>
      </header>
      { routes() }
    </div>
  </Router>
);

RootApp.propTypes = {
  routes: PropTypes.func.isRequired,
};

export default RootApp;
