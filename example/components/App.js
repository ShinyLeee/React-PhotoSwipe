import React, { PropTypes } from 'react';

const App = ({ children }) => (
  <div>
    <header>
      <h1>React-Photo-Swipe</h1>
      <small>Pure react component no dependencies, inspired by
        <a href="http://photoswipe.com/" target="_blank" rel="noopener noreferrer"> PhotoSwipe</a>
      </small>
    </header>
    { children }
  </div>
);

App.propTypes = {
  children: PropTypes.any.isRequired,
};

export default App;
