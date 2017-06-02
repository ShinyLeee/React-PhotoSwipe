import React from 'react';
import PropTypes from 'prop-types';
import { Wrapper, CroppedBox, VisibleBox, Image, PlaceHolder } from './styled';

const AnimationBox = (props) => {
  const {
    initPos,
    item,
    fitDimension,
    loadError,
    errorBox,
    rootRef,
    croppedBoxRef,
    visibleBoxRef,
    imageRef,
    onImageLoad,
  } = props;
  return (
    <Wrapper
      style={{ transform: `translate3d(${initPos.x}px, ${initPos.y}px, 0px)` }}
      innerRef={rootRef}
    >
      <CroppedBox
        side={Math.max(fitDimension.width, fitDimension.height)}
        innerRef={croppedBoxRef}
      >
        <VisibleBox
          side={Math.max(fitDimension.width, fitDimension.height)}
          shape={item.width > item.height ? 'landscape' : 'portrait'}
          innerRef={visibleBoxRef}
        >
          {
            item.msrc
            ? <Image src={item.msrc} style={fitDimension} />
            : <PlaceHolder style={fitDimension} />
          }
          {
            !loadError
            ? (
              <Image
                src={item.src}
                style={fitDimension}
                innerRef={imageRef}
                onLoad={() => onImageLoad(false)}
                onError={() => onImageLoad(true)}
              />
            )
            : (
              <PlaceHolder style={fitDimension}>
                { React.cloneElement(errorBox, { item }) }
              </PlaceHolder>
            )
          }
        </VisibleBox>
      </CroppedBox>
    </Wrapper>
  );
};

AnimationBox.displayName = 'React-Photo-Swipe__AnimationBox';

AnimationBox.propTypes = {
  initPos: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  fitDimension: PropTypes.object.isRequired,
  loadError: PropTypes.bool.isRequired,
  errorBox: PropTypes.element.isRequired,
  rootRef: PropTypes.func.isRequired,
  croppedBoxRef: PropTypes.func.isRequired,
  visibleBoxRef: PropTypes.func.isRequired,
  imageRef: PropTypes.func.isRequired,
  onImageLoad: PropTypes.func.isRequired,
};

export default AnimationBox;
