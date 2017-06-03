import styled from 'styled-components';

const Wrapper = styled.div`
  display: ${props => (props.open ? 'block' : 'none')};
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  box-sizing: border-box;
  touch-action: none;
  z-index: 1500;
  -webkit-text-size-adjust: 100%;
  outline: none;
  overflow: hidden;
`;

const Overlay = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #000;
  transform: translateZ(0);
  opacity: 0;
`;

const Container = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  user-select: none;
  touch-action: none;
  transform: translate3d(0px, 0px, 0px);
`;

Wrapper.displayName = 'Sc__Wrapper';
Overlay.displayName = 'Sc__Overlay';
Container.displayName = 'Sc__Container';

export {
  Wrapper,
  Overlay,
  Container,
};
