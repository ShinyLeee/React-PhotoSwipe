import styled from 'styled-components';

const Wrapper = styled.div`
  visibility: visible;
  opacity: ${props => (props.open ? 1 : 0.01)};
  transition: opacity 333ms cubic-bezier(0.4, 0, 0.22, 1);
  -webkit-tap-highlight-color: transparent;
  z-index: 1550;
`;

const Header = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

const Counter = styled.div`
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

const ButtonGroup = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 44px;
  cursor: pointer;
`;

const Button = styled.button`
  display: inline-block;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  background: ${props => `url(${props.url}) no-repeat 50% 50%`};
  box-shadow: none;
  border: none;
  opacity: 0.8;
  outline: none;
`;

const Footer = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.3);
`;

const Caption = styled.div`
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

Wrapper.displayName = 'Sc__TemplateWrapper';
Header.displayName = 'Sc__Header';
Counter.displayName = 'Sc__Counter';
ButtonGroup.displayName = 'Sc__ButtonGroup';
Button.displayName = 'Sc__Button';
Footer.displayName = 'Sc__Footer';
Caption.displayName = 'Sc__Caption';

export {
  Wrapper,
  Header,
  Counter,
  ButtonGroup,
  Button,
  Footer,
  Caption,
};
