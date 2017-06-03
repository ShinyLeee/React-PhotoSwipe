import React from 'react';
import PropTypes from 'prop-types';
import {
  Wrapper,
  Header,
  ButtonGroup,
  Footer,
  Content,
} from './Template.styled';

const UITemplate = ({ open, currIndex, items, onClose }) => {
  const currItem = items[currIndex];
  return (
    <Wrapper open={open}>
      <Header>
        <ButtonGroup>
          <svg onClick={onClose} fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            <path d="M0 0h24v24H0z" fill="none" />
          </svg>
        </ButtonGroup>
      </Header>
      <Footer>
        <Content>
          <span>{`${currIndex + 1}/${items.length}`}</span>
          <small>{open && currItem.desc}</small>
        </Content>
      </Footer>
    </Wrapper>
  );
};

UITemplate.propTypes = {
  open: PropTypes.bool,
  currIndex: PropTypes.number,
  items: PropTypes.array,
  onClose: PropTypes.func,
};

export default UITemplate;
