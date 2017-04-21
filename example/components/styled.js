import styled from 'styled-components';

export const Wrapper = styled.div`
  visibility: visible;
  z-index: 1550;
  opacity: ${props => (props.open ? 1 : 0.01)}
  transition: opacity 333ms cubic-bezier(0.4, 0, 0.22, 1);
`;

export const Header = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const ButtonGroup = styled.div`
  height: 44px;
  padding: 0 12px;
  cursor: pointer;
  & > svg {
    height: 100%;
  }
`;

export const Footer = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  min-height: 99px;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const Content = styled.div`
  margin: 0 auto;
  padding: 10px;
  max-width: 420px;
  height: 100%;
  color: #666;
  & > span {
    display: block;
    color: #fff;
    font-size: 13px;
    text-align: right;
  }
`;
