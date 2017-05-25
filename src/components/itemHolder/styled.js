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
  width: 100%;
  height: 100%;
  transform-origin: left top;
  touch-action: none;
`;

export const CroppedBox = styled.div`
  position: absolute;
  width: ${props => `${props.side}px`};
  height: ${props => `${props.side}px`};
  transform-origin: left top;
  overflow: hidden;
`;

export const VisibleBox = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: ${props => (props.shape === 'landscape' ? 'center top' : 'left center')};
`;

export const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  user-select: none;
  outline: none;
  -webkit-tap-highlight-color: transparent;
`;

export const PlaceHolder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  background-color: #333;
  user-select: none;
  outline: none;
  -webkit-tap-highlight-color: transparent;
`;
