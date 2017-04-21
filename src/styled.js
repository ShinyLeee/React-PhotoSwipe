import styled from 'styled-components';

export const Wrapper = styled.div`
  display: ${props => (props.open ? 'block' : 'none')};
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  box-sizing: border-box;
  overflow: hidden;
  touch-action: none;
  z-index: 1500;
  -webkit-text-size-adjust: 100%;
  outline: none;
`;

export const Overlay = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: ${props => (props.open ? 1 : 0.01)};
  will-change: opacity;
  transition: ${props => (props.isPanning ? 'none' : 'opacity 333ms cubic-bezier(0.4, 0, 0.22, 1)')};
`;

export const Container = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  user-select: none;
  touch-action: none;
  transform: translate3d(0px, 0px, 0px);
`;
