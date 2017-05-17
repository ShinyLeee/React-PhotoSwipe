import styled from 'styled-components';

export const Wrapper = styled.div`
  visibility: visible;
  z-index: 1550;
  opacity: ${props => (props.open ? 1 : 0.01)};
  transition: opacity 333ms cubic-bezier(0.4, 0, 0.22, 1);
  -webkit-tap-highlight-color: transparent;
  -webkit-overflow-scrolling: none;
`;

export const Header = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const Counter = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 44px;
  font-size: 13px;
  line-height: 44px;
  color: #FFF;
  opacity: 0.8;
  padding: 0 12px;
`;

export const ButtonGroup = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 44px;
  cursor: pointer;
`;

export const Button = styled.a`
  display: inline-block;
  width: 44px;
  height: 44px;
  background: ${props => `url(${props.url}) no-repeat 50% 50%`}
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
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  color: #ccc;
  & > p {
    display: block;
    display: -webkit-box;
    margin: 6px 0;
    padding: 0;
    max-height: 59px;
    text-overflow: ellipsis;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow : hidden;
  }
  & > small {
    display: block;
    width: 100%;
    font-size: 11px;
    color: #bbb;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
`;
