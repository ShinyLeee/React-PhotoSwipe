import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Warning = styled.small`
  display: block;
  margin: 18px 0;
  color: red;
  background-color: #fff0f0;
  border: 1px solid #ffd7d7;
`;

const RootApp = ({ routes }) => (
  <Router>
    <div>
      <header>
        <h1>React-PhotoSwipe</h1>
        <small>Pure react image gallery component for mobile device, inspired by&nbsp;
          <a href="http://photoswipe.com/" target="_blank" rel="noopener noreferrer">PhotoSwipe</a>
        </small>
        { !('ontouchstart' in window) && <Warning>Warning: React-PhotoSwipe only support touchable mobile device.</Warning>}
      </header>
      { routes() }
    </div>
  </Router>
);

RootApp.propTypes = {
  routes: PropTypes.func.isRequired,
};

export default RootApp;
