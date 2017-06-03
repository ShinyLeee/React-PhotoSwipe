/* eslint-disable import/prefer-default-export */
import styled from 'styled-components';

const Wrapper = styled.p`
  position: absolute;
  left: 0;
  top: 50%;
  right: 0;
  bottom: 0;
  margin: 0;
  font-size: 14px;
  line-height: 0;
  color: #ccc;
  text-align: center;
  & > a {
    color: #ccc;
    text-decoration: underline;
  }
`;

Wrapper.displayName = 'Sc__ErrorBoxWrapper';

export {
  Wrapper,
};
