/* eslint-disable react/prefer-stateless-function */
import React, { Component, PropTypes } from 'react';
import { Router, browserHistory } from 'react-router';

export default class Root extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        {this.props.routes()}
      </Router>
    );
  }
}

Root.propTypes = {
  routes: PropTypes.func.isRequired,
};
