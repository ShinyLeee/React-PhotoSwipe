import styled from 'styled-components';
import withGesture from '../gesture/index';

const Wrapper = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
`;

export const EnhancedWrapper = withGesture(Wrapper);

export const AnimWrapper = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  transform-origin: left top;
  touch-action: none;
`;

export const PlaceHolder = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
`;

export const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
`;
