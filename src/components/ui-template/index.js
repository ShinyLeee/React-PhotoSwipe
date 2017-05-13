import React, { Component, PropTypes } from 'react';
import {
  Wrapper,
  Header,
  Counter,
  ButtonGroup,
  Footer,
  Caption,
} from './styled';

export default class UITemplate extends Component {

  // TODO
  // shouldComponentUpdate(nextProps) {
  //   return this.props.open !== nextProps.open;
  // }

  render() {
    const {
      open,
      currIndex,
      items,
      onClose,
    } = this.props;
    let currItem;
    if (open) currItem = items[currIndex];
    return (
      <Wrapper open={open} innerRef={(node) => { this.wrapper = node; }}>
        <Header>
          <Counter>{`${currIndex + 1} / ${items.length}`}</Counter>
          <ButtonGroup>
            <svg onClick={onClose} fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              <path d="M0 0h24v24H0z" fill="none" />
            </svg>
          </ButtonGroup>
        </Header>
        {
          open && (currItem.title || currItem.desc) && (
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
};

UITemplate.propTypes = {
  open: PropTypes.bool.isRequired,
  currIndex: PropTypes.number,
  items: PropTypes.array,
  onClose: PropTypes.func.isRequired,
};
