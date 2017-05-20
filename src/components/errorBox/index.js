/* eslint-disable global-require */
import React, { PropTypes } from 'react';
import { Wrapper } from './styled';

const ErrorBox = ({ item }) => (
  <Wrapper open={open}>
    This&nbsp;
    <a href={item.src} target="_blank" rel="noopener noreferrer">item</a>
    &nbsp;can not be loaded.
  </Wrapper>
);

ErrorBox.displayName = 'React-Photo-Swipe__ErrorBox';

ErrorBox.propTypes = {
  item: PropTypes.object,
};

export default ErrorBox;
