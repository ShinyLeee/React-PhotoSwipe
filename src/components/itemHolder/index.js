import React, { Component, PropTypes } from 'react';
import withGesture from '../gesture/index';
import {
  Wrapper,
  AnimWrapper,
  PlaceHolder,
  Image,
} from './styled';
import {
  PAN_FRICTION_LEVEL,
  ZOOM_LEVEL_INCRE,
  BOUNCE_BACK_DURATION,
} from '../../utils/constant';
import { getEmptyPoint } from '../../utils/index';
import startAnimation from '../../utils/animation';

const EnhancedWrapper = withGesture(Wrapper);

export default class ItemHolder extends Component {

  constructor(props) {
    super(props);

    this.isZoom = false;
    this.lastScale = 1;
    // Stored for calculate` realScale` based on lastScale and currentScale
    this.scaleRatio = undefined;
    // Previous panning delta only for panning zoomed item
    this.panningPos = getEmptyPoint();
    this.outOfXBound = false;
    this.outOfYBound = false;

    this.handleTap = this.handleTap.bind(this);
    this.handleDoubleTap = this.handleDoubleTap.bind(this);
    this.handlePanStart = this.handlePanStart.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handlePanEnd = this.handlePanEnd.bind(this);
    this.handleSwipe = this.handleSwipe.bind(this);
    this.handlePinch = this.handlePinch.bind(this);
    this.handlePinchEnd = this.handlePinchEnd.bind(this);
  }

  shouldComponentUpdate() {
    // TODO
    return true;
  }

  // The position where animationWrapper always in the center
  getAnimWrapperCenterPos(scale = 1) {
    // the scale might based on previous
    const { viewportSize } = this.props;
    const itemDimension = this.itemDimension;
    return {
      x: Math.round((viewportSize.width - (itemDimension.width * scale)) / 2),
      y: Math.round((viewportSize.height - (itemDimension.height * scale)) / 2),
    };
  }

  get wrapperXPos() {
    const { indexDiff, viewportSize, spacing } = this.props;
    return Math.round(indexDiff * viewportSize.width * (1 + spacing));
  }

  get fitRatio() {
    const { item, viewportSize } = this.props;
    const hRatio = viewportSize.width / item.width;
    const vRatio = viewportSize.height / item.height;
    return hRatio < vRatio ? hRatio : vRatio;
  }

  get itemDimension() {
    const { item } = this.props;
    const fitRatio = this.fitRatio;
    return {
      width: Math.round(fitRatio * item.width),
      height: Math.round(fitRatio * item.height),
    };
  }

  get itemBound() {
    const { viewportSize } = this.props;
    const itemDimension = this.itemDimension;
    const currCenterPos = this.getAnimWrapperCenterPos(this.lastScale);

    const realItemWidth = itemDimension.width * this.lastScale;
    const realItemHeight = itemDimension.height * this.lastScale;

    const xMovingRange = realItemWidth > viewportSize.width
                          ? Math.round((realItemWidth - viewportSize.width) / 2)
                          : 0;
    const yMovingRange = realItemHeight > viewportSize.height
                          ? Math.round((realItemHeight - viewportSize.height) / 2)
                          : 0;

    const xBounds = {
      left: currCenterPos.x + xMovingRange,
      right: currCenterPos.x - xMovingRange,
    };

    const yBounds = {
      top: currCenterPos.y + yMovingRange,
      bottom: currCenterPos.y - yMovingRange,
    };

    return {
      x: xBounds,
      y: yBounds,
    };
  }

  calculatePanOffset(currPos, bound) { // eslint-disable-line class-methods-use-this
    return {
      left: currPos.x - bound.x.left,
      right: currPos.x - bound.x.right,
      top: currPos.y - bound.y.top,
      bottom: currPos.y - bound.y.bottom,
    };
  }

  applyAnimWrapperTransform(x, y, scale) {
    this.animWrapper.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
  }

  handleTap(e) {
    // console.log(e, 'tap');
    this.props.onTap(e);
  }

  handleDoubleTap(e) {
    // console.log(e, 'doubleTap');
    this.props.onDoubleTap(e);
  }

  handlePanStart(e) {
    if (this.isZoom && this.panningPos.x === null && this.panningPos.y === null) {
      const centerPos = this.getAnimWrapperCenterPos(this.lastScale);
      this.panningPos = {
        x: centerPos.x,
        y: centerPos.y,
      };
    }
    // console.log(`panStart: ${this.panningPos.x}, ${this.panningPos.y}`);
    this.props.onPanStart(e);
  }

  /**
   *
   * @param {Object} e - Processed `Pan` event object
   * @param {String} e.direction - `lr` or `ud`
   * @param {Object} e.delta - { x, y, accX, accY }
   */
  handlePan(e) {
    const direction = e.direction;
    const delta = e.delta;
    if (this.isZoom) {
      let currXPos = this.panningPos.x + delta.accX;
      let currYPos = this.panningPos.y + delta.accY;

      const bound = this.itemBound;
      // If panning out of item bounds we should make it very hard to continue pan
      const offset = this.calculatePanOffset({ x: currXPos, y: currYPos }, bound);

      if (offset.left > 0 || offset.right < 0) {
        this.outOfXBound = true;
        currXPos = offset.left > 0
                    ? bound.x.left + (offset.left * PAN_FRICTION_LEVEL)
                    : bound.x.right + (offset.right * PAN_FRICTION_LEVEL);
      }

      if (offset.top > 0 || offset.bottom < 0) {
        this.outOfYBound = true;
        currYPos = offset.top > 0
                    ? bound.y.top + (offset.top * PAN_FRICTION_LEVEL)
                    : bound.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL);
      }
      this.applyAnimWrapperTransform(currXPos, currYPos, this.lastScale);
    } else {
      if (direction === 'ud') {
        const initCenterPos = this.getAnimWrapperCenterPos();
        this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y + delta.accY, 1);
      }
      this.props.onPan(direction, delta, this.itemDimension);
    }
  }

  handlePanEnd(e) {
    if (this.isZoom) {
      let currXPos = this.panningPos.x + e.delta.accX;
      let currYPos = this.panningPos.y + e.delta.accY;

      // If pan out of bounds we should bounce back
      let nextXPos = currXPos;
      let nextYPos = currYPos;

      if (this.outOfXBound || this.outOfYBound) {
        const bound = this.itemBound;
        const offset = this.calculatePanOffset({ x: currXPos, y: currYPos }, bound);

        if (offset.left > 0 || offset.right < 0) {
          nextXPos = offset.left > 0 ? bound.x.left : bound.x.right;
          currXPos = offset.left > 0
                      ? bound.x.left + (offset.left * PAN_FRICTION_LEVEL)
                      : bound.x.right + (offset.right * PAN_FRICTION_LEVEL);
        }
        if (offset.top > 0 || offset.bottom < 0) {
          nextYPos = offset.top > 0 ? bound.y.top : bound.y.bottom;
          currYPos = offset.top > 0
                      ? bound.y.top + (offset.top * PAN_FRICTION_LEVEL)
                      : bound.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL);
        }
        startAnimation(
          { x: currXPos, y: currYPos },
          { x: nextXPos, y: nextYPos },
          BOUNCE_BACK_DURATION,
          'sineOut',
          pos => this.applyAnimWrapperTransform(pos.x, pos.y, this.lastScale),
        );
        this.outOfXBound = false;
        this.outOfYBound = false;
      }

      // Store panning stopped position
      this.panningPos = {
        x: nextXPos,
        y: nextYPos,
      };
    }
  }

  handleSwipe(e) {
    // console.log(e.direction, 'swipe');
    if (!this.isZoom) {
      const direction = e.direction;
      const delta = e.delta;
      // We need to restore the initial postition when Swipe Up / Down
      if ((direction === 'Up' || direction === 'Down')) {
        const initCenterPos = this.getAnimWrapperCenterPos();
        const sPos = initCenterPos.y + delta.accY;
        const ePos = initCenterPos.y;
        startAnimation(sPos, ePos, BOUNCE_BACK_DURATION, 'easeOutCubic', (pos) => {
          this.applyAnimWrapperTransform(initCenterPos.x, pos, 1);
        });
      }
      this.props.onSwipe(direction, delta, this.itemDimension);
    }
  }

  handlePinch(e) {
    // console.log(e.scale, e.isEnd, 'pinch');
    if (this.scaleRatio === undefined) {
      this.scaleRatio = this.lastScale / e.scale;
    }
    const { maxZoomLevel } = this.props;
    const realScale = e.scale * this.scaleRatio;

    if (realScale < (maxZoomLevel + ZOOM_LEVEL_INCRE)) {
      const centerPos = this.getAnimWrapperCenterPos(realScale);
      this.applyAnimWrapperTransform(centerPos.x, centerPos.y, realScale);
    }
  }

  handlePinchEnd(e) {
    const { pinchToCloseThresholder, maxZoomLevel } = this.props;
    const realScale = Math.min(e.scale * this.scaleRatio, maxZoomLevel + ZOOM_LEVEL_INCRE);

    if (realScale < 1) {
      const initCenterPos = this.getAnimWrapperCenterPos();
      if (realScale < pinchToCloseThresholder) {
        this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
        this.props.onPinch(e);
      } else {
        const currCenterPos = this.getAnimWrapperCenterPos(realScale);
        startAnimation(
          { x: currCenterPos.x, y: currCenterPos.y, scale: realScale },
          { x: initCenterPos.x, y: initCenterPos.y, scale: 1 },
          BOUNCE_BACK_DURATION,
          'easeOutCubic',
          pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
        );
      }
      this.isZoom = false;
      this.lastScale = 1;
      this.scaleRatio = undefined;
      this.panningPos = getEmptyPoint();
    } else {
      // TODO modify image dimension style after zoom
      if (realScale > maxZoomLevel) {
        const currCenterPos = this.getAnimWrapperCenterPos(realScale);
        const nextCenterPos = this.getAnimWrapperCenterPos(maxZoomLevel);
        startAnimation(
          { x: currCenterPos.x, y: currCenterPos.y, scale: realScale },
          { x: nextCenterPos.x, y: nextCenterPos.y, scale: maxZoomLevel },
          BOUNCE_BACK_DURATION,
          'easeOutCubic',
          pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
        );
      }
      this.isZoom = true;
      this.lastScale = Math.min(realScale, 2);
      this.scaleRatio = undefined;
      this.panningPos = getEmptyPoint();
    }
  }

  render() {
    const { item } = this.props;
    const initCenterPos = this.getAnimWrapperCenterPos();
    return (
      <EnhancedWrapper
        style={{ transform: `translate3d(${this.wrapperXPos}px, 0px, 0px)` }}
        onTap={this.handleTap}
        onDoubleTap={this.handleDoubleTap}
        onPanStart={this.handlePanStart}
        onPan={this.handlePan}
        onPanEnd={this.handlePanEnd}
        onSwipe={this.handleSwipe}
        onPinch={this.handlePinch}
        onPinchEnd={this.handlePinchEnd}
      >
        <AnimWrapper
          style={{ transform: `translate3d(${initCenterPos.x}px, ${initCenterPos.y}px, 0px)` }}
          innerRef={(node) => { this.animWrapper = node; }}
        >
          { item.msrc && <PlaceHolder src={item.msrc} role="presentation" /> }
          <Image
            src={item.src}
            style={this.itemDimension}
            innerRef={(node) => { this.image = node; }}
          />
        </AnimWrapper>
      </EnhancedWrapper>
    );
  }
}

ItemHolder.displayName = 'React-Photo-Swipe__ItemHolder';

ItemHolder.defaultProps = {
  onTap: () => {},
  onDoubleTap: () => {},
  onPanStart: () => {},
  onPan: () => {},
  onPanEnd: () => {},
  onSwipe: () => {},
  onPinch: () => {},
  onPinchEnd: () => {},
};

ItemHolder.propTypes = {
  itemIndex: PropTypes.number.isRequired,
  indexDiff: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  viewportSize: PropTypes.object,
  loop: PropTypes.bool,
  spacing: PropTypes.number,
  showAnimateDuration: PropTypes.number,
  hideAnimateDuration: PropTypes.number,
  pinchToCloseThresholder: PropTypes.number,
  maxZoomLevel: PropTypes.number,

  onTap: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func.isRequired,
  onPanStart: PropTypes.func.isRequired,
  onPan: PropTypes.func.isRequired,
  onPanEnd: PropTypes.func.isRequired,
  onSwipe: PropTypes.func.isRequired,
  onPinch: PropTypes.func.isRequired,
  onPinchEnd: PropTypes.func.isRequired,
};
