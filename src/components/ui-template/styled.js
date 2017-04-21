import styled from 'styled-components';

export const Wrapper = styled.div`
  visibility: visible;
  z-index: 1550;
  opacity: ${props => (props.open ? 1 : 0.01)}
  transition: opacity 333ms cubic-bezier(0.4, 0, 0.22, 1);
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const Counter = styled.div`
  height: 44px;
  font-size: 13px;
  line-height: 44px;
  color: #FFF;
  opacity: 0.8;
  padding: 0 12px;
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
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const Caption = styled.div`
  margin: 0 auto;
  padding: 10px;
  max-width: 420px;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  color: #ccc;
  & > p {
    margin: 0;
    padding: 0;
  }
  & > small {
    font-size: 11px;
    color: #BBB;
  }
`;
