/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Wrapper,
  Header,
  Counter,
  ButtonGroup,
  Button,
  Footer,
  Caption,
} from './styled';

const UITemplate = ({ open, items, currIndex, loaded, onClose }) => {
  const currItem = items[currIndex];
  return (
    <Wrapper open={open}>
      <Header>
        <Counter>{`${currIndex + 1} / ${items.length}`}</Counter>
        <ButtonGroup>
          <Button url={require('./ic_spinner_white.svg')} style={{ opacity: loaded ? 0.01 : 0.8 }} />
          <Button url={require('./ic_close_white_24px.svg')} onClick={onClose} />
        </ButtonGroup>
      </Header>
      {
        (currItem.title || currItem.desc) && (
          <Footer>
            <Caption>
              <p>{currItem.desc}</p>
              <small>{currItem.title}</small>
            </Caption>
          </Footer>
        )
      }
    </Wrapper>
  );
};

UITemplate.displayName = 'React-Photo-Swipe__UITemplate';

UITemplate.propTypes = {
  open: false,
  items: [],
  currIndex: 0,
  loaded: false,
};

UITemplate.propTypes = {
  open: PropTypes.bool.isRequired,
  items: PropTypes.array.isRequired,
  currIndex: PropTypes.number.isRequired,
  loaded: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UITemplate;
