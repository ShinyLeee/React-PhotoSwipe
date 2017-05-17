/* eslint-disable global-require */
import React, { Component, PropTypes } from 'react';
import {
  Wrapper,
  Header,
  Counter,
  ButtonGroup,
  Button,
  Footer,
  Caption,
} from './styled';

export default class UITemplate extends Component {

  render() {
    const {
      open,
      currIndex,
      items,
      onClose,
    } = this.props;
    const currItem = items[currIndex];
    return (
      <Wrapper open={open}>
        <Header>
          <Counter>{`${currIndex + 1} / ${items.length}`}</Counter>
          <ButtonGroup>
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
  }
}

UITemplate.displayName = 'React-Photo-Swipe__UITemplate';

UITemplate.propTypes = {
  open: false,
  currIndex: 0,
};

UITemplate.propTypes = {
  open: PropTypes.bool.isRequired,
  currIndex: PropTypes.number.isRequired,
  items: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};
