import styled from 'styled-components';

const Wrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: left top;
  touch-action: none;
`;

const CroppedBox = styled.div`
  position: absolute;
  width: ${props => `${props.side}px`};
  height: ${props => `${props.side}px`};
  transform-origin: left top;
  overflow: ${props => (props.animating ? 'hidden' : '')};
`;

const VisibleBox = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: ${props => (props.shape === 'landscape' ? 'center top' : 'left center')};
`;

const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  user-select: none;
  outline: none;
  -webkit-tap-highlight-color: transparent;
`;

const PlaceHolder = styled.div`
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

Wrapper.displayName = 'Sc__AnimationBoxWrapper';
CroppedBox.displayName = 'Sc__CroppedBox';
VisibleBox.displayName = 'Sc__VisibleBox';
Image.displayName = 'Sc__Image';
PlaceHolder.displayName = 'Sc__PlaceHolder';

export {
  Wrapper,
  CroppedBox,
  VisibleBox,
  Image,
  PlaceHolder,
};
