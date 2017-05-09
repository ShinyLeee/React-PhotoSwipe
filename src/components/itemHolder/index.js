/* eslint-disable no-param-reassign */
import React, { Component, PropTypes } from 'react';
import {
  EnhancedWrapper,
  AnimWrapper,
  PlaceHolder,
  Image,
} from './styled';
import { FRICTION_LEVEL, BOUNCE_BACK_DURATION } from '../../utils/constant';
import { getEmptyPoint, isDomElement } from '../../utils';
import requestAnimation from '../../utils/animation';

export default class ItemHolder extends Component {

  constructor(props) {
    super(props);

    this.isZoom = false;
    this.scaleRatio = undefined;
    this.currScale = 1; // real scale that manipulate item style
    this.currPos = this.getAnimWrapperCenterPos(); // Previous position for zoom gesture
    this.preservedOffset = getEmptyPoint(); // Composed by panning and pinch delta
    this.maxZoomPos = getEmptyPoint(); // Bounce back position if exceed maxZoomLevel
    this.maxEventScale = 0;
    this.maxPivotScale = this.covertScale(props.maxZoomScale, false);
    this.outOfXBound = false;
    this.outOfYBound = false;

    this.handleTap = this.handleTap.bind(this);
    this.handleDoubleTap = this.handleDoubleTap.bind(this);
    this.handlePanStart = this.handlePanStart.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handlePanEnd = this.handlePanEnd.bind(this);
    this.handleSwipe = this.handleSwipe.bind(this);
    this.handlePinchStart = this.handlePinchStart.bind(this);
    this.handlePinch = this.handlePinch.bind(this);
    this.handlePinchEnd = this.handlePinchEnd.bind(this);
  }

  componentDidMount() {
    const { itemIndex, currIndex } = this.props;
    if (itemIndex === currIndex) {
      this.requestInAnimation();
    }
  }

  shouldComponentUpdate() {
    return true; // TODO
  }

  componentDidUpdate(prevProps) {
    const { open, itemIndex, currIndex } = this.props;
    if (prevProps.open !== open && itemIndex === currIndex) {
      this.requestInAnimation();
    }
  }

  getItemDimension(isZoom) {
    const { item } = this.props;
    const fitRatio = this.fitRatio;
    return {
      width: isZoom ? item.width : Math.round(fitRatio * item.width),
      height: isZoom ? item.height : Math.round(fitRatio * item.height),
    };
  }

  // item bounds position
  getItemBounds() {
    const { viewportSize, maxZoomScale } = this.props;
    const scale = Math.min(this.currScale, this.isZoom ? maxZoomScale : this.maxPivotScale);
    const itemDimension = this.getItemDimension(this.isZoom);
    const currCenterPos = this.getAnimWrapperCenterPos(scale, this.isZoom);

    const realItemWidth = itemDimension.width * scale;
    const realItemHeight = itemDimension.height * scale;

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

  // The position where animationWrapper always in the center
  getAnimWrapperCenterPos(scale = 1, isZoom = false) {
    const dimension = this.getItemDimension(isZoom);
    const { viewportSize } = this.props;
    return {
      x: Math.round((viewportSize.width - (dimension.width * scale)) / 2),
      y: Math.round((viewportSize.height - (dimension.height * scale)) / 2),
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

  applyOverlayOpacity(opacity) {
    this.props.overlay.style.opacity = opacity;
  }

  applyAnimWrapperTransform(x, y, scale) {
    this.animWrapper.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
  }

  applyImageSize(dimension) {
    this.image.style.width = `${dimension.width}px`;
    this.image.style.height = `${dimension.height}px`;
  }

  calculatePinchDelta(initCenter, center, scale) {
    const { viewportSize } = this.props;
    const screenCenter = {
      x: Math.round(viewportSize.width * 0.5),
      y: Math.round(viewportSize.height * 0.5),
    };
    const distance = {
      x: screenCenter.x - initCenter.x,
      y: screenCenter.y - initCenter.y,
    };
    const offset = {
      x: center.x - initCenter.x,
      y: center.y - initCenter.y,
    };
    const ratio = scale > 1 ? scale - 1 : 1 - scale;
    return {
      x: Math.round((distance.x * ratio) + offset.x),
      y: Math.round((distance.y * ratio) + offset.y),
    };
  }

  calculateOffset(currPos, bound) { // eslint-disable-line class-methods-use-this
    return {
      left: currPos.x - bound.x.left, // left < 0 means overflow left bound
      right: currPos.x - bound.x.right, // right > 0 means overflow right bound
      top: currPos.y - bound.y.top, // top < 0 means overflow top bound
      bottom: currPos.y - bound.y.bottom, // bottom > 0 means overflow bottom bound
    };
  }

  covertScale(scale, toZoomScale) {
    const fitRatio = this.fitRatio;
    return toZoomScale ? scale * fitRatio : scale * (1 / fitRatio);
  }

  resetZoomStatus(innerClose = true) {
    if (innerClose) {
      this.props.onInnerClose();
    }
    const initCenterPos = this.getAnimWrapperCenterPos();
    this.applyImageSize(this.getItemDimension());
    this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
    this.isZoom = false;
    this.scaleRatio = undefined;
    this.currScale = 1;
    this.preservedOffset = getEmptyPoint();
    this.currPos = initCenterPos;
  }

  adjustItemPosition(currScale, nextScale, currPos, nextPos) {
    if (nextPos === undefined) {
      nextPos = JSON.parse(JSON.stringify(currPos));
    }
    const bounds = this.getItemBounds();
    const offset = this.calculateOffset(nextPos, bounds);

    const nextCenterPos = this.getAnimWrapperCenterPos(nextScale, this.isZoom);

    if ((offset.left === offset.right) || (offset.left > 0 && offset.right < 0)) {
      nextPos.x = nextCenterPos.x;
      this.preservedOffset.x = 0;
    } else if (offset.left > 0 && offset.right > 0) {
      nextPos.x = bounds.x.left;
      this.preservedOffset.x = -nextCenterPos.x;
    } else if (offset.left < 0 && offset.right < 0) {
      nextPos.x = bounds.x.right;
      this.preservedOffset.x = nextCenterPos.x;
    }

    if ((offset.top === offset.bottom) || (offset.top > 0 && offset.bottom < 0)) {
      nextPos.y = nextCenterPos.y;
      this.preservedOffset.y = 0;
    } else if (offset.top > 0 && offset.bottom > 0) {
      nextPos.y = bounds.y.top;
      this.preservedOffset.y = -nextCenterPos.y;
    } else if (offset.top < 0 && offset.bottom < 0) {
      nextPos.y = bounds.y.bottom;
      this.preservedOffset.y = nextCenterPos.y;
    }

    requestAnimation(
      { x: currPos.x, y: currPos.y, scale: currScale },
      { x: nextPos.x, y: nextPos.y, scale: nextScale },
      BOUNCE_BACK_DURATION,
      'sineOut',
      pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
      () => {
        if (!this.isZoom) {
          const zoomedScale = this.covertScale(nextScale, true);
          const zoomedItemDimension = this.getItemDimension(true);
          this.applyImageSize(zoomedItemDimension);
          this.applyAnimWrapperTransform(nextPos.x, nextPos.y, zoomedScale);
          this.currScale = zoomedScale;
        } else {
          this.applyAnimWrapperTransform(nextPos.x, nextPos.y, nextScale);
          this.currScale = nextScale;
        }
        this.scaleRatio = undefined;
        this.currPos.x = nextPos.x;
        this.currPos.y = nextPos.y;
        this.maxZoomPos = getEmptyPoint();
        this.isZoom = true;
      },
    );
  }

  requestInAnimation() {
    const { currIndex, sourceElement, showAnimateDuration } = this.props;
    let start = 0;
    let end = 1;
    if (sourceElement !== undefined) {
      const origItemDimension = this.getItemDimension();
      const initCenterPos = this.getAnimWrapperCenterPos();
      const rect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      start = {
        x: rect.left,
        y: rect.top,
        scale: rect.width / origItemDimension.width,
        opacity: 0,
      };
      end = {
        x: initCenterPos.x,
        y: initCenterPos.y,
        scale: 1,
        opacity: 1,
      };
    }
    requestAnimation(
      start,
      end,
      showAnimateDuration,
      'easeOutCubic',
      (pos) => {
        if (sourceElement !== undefined) {
          this.applyOverlayOpacity(pos.opacity);
          this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
        } else {
          this.applyOverlayOpacity(pos);
        }
      },
    );
  }

  requestOutAnimation(startStyle, endStyle, callback) {
    const { currIndex, sourceElement, hideAnimateDuration } = this.props;
    const start = startStyle;
    let end = endStyle; // default endStyle --> swipe out of top / bottom
    if (sourceElement !== undefined) {
      const itemDImension = this.getItemDimension(this.isZoom);
      const rect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      end = {
        x: rect.left,
        y: rect.top,
        scale: rect.width / itemDImension.width,
        opacity: 0,
      };
    }
    requestAnimation(
      start,
      end,
      hideAnimateDuration,
      'easeOutCubic',
      (pos) => {
        this.applyOverlayOpacity(pos.opacity);
        this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
      },
      () => callback(),
    );
  }

  handleTap(e) {
    this.props.onTap(e);
  }

  handleDoubleTap(e) {
    let start;
    let end;
    const preservedOffset = this.preservedOffset;
    const initCenterPos = this.getAnimWrapperCenterPos();
    if (!this.isZoom) {
      const nextScale = this.covertScale(1, false);
      const nextCenterPos = this.getAnimWrapperCenterPos(nextScale);
      const delta = this.calculatePinchDelta(e.position, e.position, nextScale);
      preservedOffset.x = delta.x;
      preservedOffset.y = delta.y;
      start = { x: initCenterPos.x, y: initCenterPos.y, scale: this.currScale };
      end = { x: nextCenterPos.x + delta.x, y: nextCenterPos.y + delta.y, scale: nextScale };
    } else {
      const currScale = this.currScale;
      const currCenterPos = this.getAnimWrapperCenterPos(currScale, true);
      const initScale = this.covertScale(1, true);
      start = { x: currCenterPos.x + preservedOffset.x, y: currCenterPos.y + preservedOffset.y, scale: currScale }; // eslint-disable-line max-len
      end = { x: initCenterPos.x, y: initCenterPos.y, scale: initScale };
    }
    requestAnimation(
      start,
      end,
      BOUNCE_BACK_DURATION,
      'sineOut',
      pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
      () => {
        if (!this.isZoom) {
          const zoomedItemDimension = this.getItemDimension(true);
          this.applyImageSize(zoomedItemDimension);
          this.applyAnimWrapperTransform(end.x, end.y, 1);
          this.isZoom = true;
          this.currScale = 1;
          this.scaleRatio = undefined;
          this.currPos.x = end.x;
          this.currPos.y = end.y;
        } else {
          this.resetZoomStatus(false);
        }
      },
    );
    this.props.onDoubleTap(e);
  }

  handlePanStart(e) {
    if (this.props.onPanStart) {
      this.props.onPanStart(e);
    }
  }

  // TODO make it throttled by rAF
  handlePan(e) {
    const { viewportSize } = this.props;
    const direction = e.direction;
    const delta = e.delta;
    if (this.isZoom) {
      let currXPos = this.currPos.x + delta.accX;
      let currYPos = this.currPos.y + delta.accY;

      const bounds = this.getItemBounds();
      // If panning out of bounds we should make it hard to continue
      const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

      if (offset.left > 0) { // out of left bounds
        this.outOfXBound = true;
        currXPos = bounds.x.left + (offset.left * FRICTION_LEVEL);
      } else if (offset.right < 0) { // out of right bounds
        this.outOfXBound = true;
        currXPos = bounds.x.right + (offset.right * FRICTION_LEVEL);
      }

      if (offset.top > 0) { // out of top bounds
        this.outOfYBound = true;
        currYPos = bounds.y.top + (offset.top * FRICTION_LEVEL);
      } else if (offset.bottom < 0) { // out of bottom bounds
        this.outOfYBound = true;
        currYPos = bounds.y.bottom + (offset.bottom * FRICTION_LEVEL);
      }
      this.applyAnimWrapperTransform(currXPos, currYPos, this.currScale);
    } else if (this.currScale === 1) {
      if (direction === 'ud') {
        const absAccY = Math.abs(delta.accY);
        const opacity = Math.max(1 - (absAccY / viewportSize.height), 0);
        const initCenterPos = this.getAnimWrapperCenterPos();
        this.applyOverlayOpacity(opacity);
        this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y + delta.accY, 1);
      }
      this.props.onPan(direction, delta);
    }
  }

  handlePanEnd(e) {
    if (this.isZoom) {
      let currXPos = this.currPos.x + e.delta.accX;
      let currYPos = this.currPos.y + e.delta.accY;

      // If pan out of bounds we should bounce back
      let nextXPos = currXPos;
      let nextYPos = currYPos;

      this.preservedOffset.x += e.delta.accX;
      this.preservedOffset.y += e.delta.accY;

      if (this.outOfXBound || this.outOfYBound) {
        const bounds = this.getItemBounds();
        const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

        const currCenterPos = this.getAnimWrapperCenterPos(this.currScale, true);

        if (offset.left > 0) {
          nextXPos = bounds.x.left;
          currXPos = bounds.x.left + (offset.left * FRICTION_LEVEL);
          this.preservedOffset.x = bounds.x.left - currCenterPos.x;
        } else if (offset.right < 0) {
          nextXPos = bounds.x.right;
          currXPos = bounds.x.right + (offset.right * FRICTION_LEVEL);
          this.preservedOffset.x = bounds.x.right - currCenterPos.x;
        }

        if (offset.top > 0) {
          nextYPos = bounds.y.top;
          currYPos = bounds.y.top + (offset.top * FRICTION_LEVEL);
          this.preservedOffset.y = bounds.y.top - currCenterPos.y;
        } else if (offset.bottom < 0) {
          nextYPos = bounds.y.bottom;
          currYPos = bounds.y.bottom + (offset.bottom * FRICTION_LEVEL);
          this.preservedOffset.y = bounds.y.bottom - currCenterPos.y;
        }
        requestAnimation(
          { x: currXPos, y: currYPos },
          { x: nextXPos, y: nextYPos },
          BOUNCE_BACK_DURATION,
          'sineOut',
          pos => this.applyAnimWrapperTransform(pos.x, pos.y, this.currScale),
        );
        this.outOfXBound = false;
        this.outOfYBound = false;
      }
      this.currPos.x = nextXPos;
      this.currPos.y = nextYPos;
    }
  }

  handleSwipe(e) {
    if (!this.isZoom) {
      const { viewportSize, swipeToCloseThreshold } = this.props;
      const direction = e.direction;
      const delta = e.delta;
      const absAccY = Math.abs(delta.accY);
      if ((direction === 'Up' || direction === 'Down')) {
        const origItemDimension = this.getItemDimension();
        const initCenterPos = this.getAnimWrapperCenterPos();

        const start = {
          x: initCenterPos.x,
          y: initCenterPos.y + delta.accY,
          scale: 1,
          opacity: Math.max(1 - (absAccY / viewportSize.height), 0),
        };
        let end;

        const shouldClose = absAccY > (swipeToCloseThreshold * viewportSize.height);
        if (shouldClose) {
          const swipeCloseCallback = () => {
            this.props.onInnerClose();
            this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
          };
          end = direction === 'Up'
          ? { x: initCenterPos.x, y: -origItemDimension.height, scale: 1, opacity: 0 }
          : { x: initCenterPos.x, y: (initCenterPos.y * 2) + origItemDimension.height, scale: 1, opacity: 0 }; // eslint-disable-line max-len
          this.requestOutAnimation(start, end, swipeCloseCallback);
        } else {
          end = { x: initCenterPos.x, y: initCenterPos.y, opacity: 1 };
          requestAnimation(
            start,
            end,
            BOUNCE_BACK_DURATION,
            'sineOut',
            (pos) => {
              this.applyOverlayOpacity(pos.opacity);
              this.applyAnimWrapperTransform(pos.x, pos.y, 1);
            },
          );
        }
      }
      this.props.onSwipe(direction, delta);
    }
  }

  handlePinchStart(e) {
    if (this.props.onPinchStart) {
      this.props.onPinchStart(e);
    }
  }

  // TODO make it throttled by rAF
  handlePinch(e) {
    if (this.scaleRatio === undefined) {
      this.scaleRatio = this.currScale / e.scale;
    }

    const maxPivotScale = this.maxPivotScale;

    // real scale that manipulate item style
    const realScale = e.scale * this.scaleRatio;
    // pivot scale that always based on original item dimension
    const pivotScale = this.isZoom ? this.covertScale(realScale, false) : realScale;

    if (pivotScale < maxPivotScale) {
      if (pivotScale < 1) {
        this.applyOverlayOpacity(pivotScale);
      }
      const currCenterPos = this.getAnimWrapperCenterPos(pivotScale);
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);

      const nextXPos = currCenterPos.x + this.preservedOffset.x + pinchDelta.x;
      const nextYPos = currCenterPos.y + this.preservedOffset.y + pinchDelta.y;

      this.applyAnimWrapperTransform(nextXPos, nextYPos, realScale);
      this.currScale = realScale;
    } else if (pivotScale > maxPivotScale) {
      if (this.maxZoomPos.x === null || this.maxZoomPos.y === null) {
        const maxCenterPos = this.getAnimWrapperCenterPos(maxPivotScale);
        const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);
        this.maxZoomPos.x = maxCenterPos.x + this.preservedOffset.x + pinchDelta.x;
        this.maxZoomPos.y = maxCenterPos.y + this.preservedOffset.y + pinchDelta.y;
        this.maxEventScale = e.scale;
      }
      let slowScale = maxPivotScale + ((pivotScale - maxPivotScale) * 0.1);
      const currCenterPos = this.getAnimWrapperCenterPos(slowScale);
      const slowZoomScale = this.maxEventScale + ((e.scale - this.maxEventScale) * 0.1);
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, slowZoomScale);

      const nextXPos = currCenterPos.x + this.preservedOffset.x + pinchDelta.x;
      const nextYPos = currCenterPos.y + this.preservedOffset.y + pinchDelta.y;

      if (this.isZoom) {
        slowScale = this.covertScale(slowScale, true);
      }
      this.applyAnimWrapperTransform(nextXPos, nextYPos, slowScale);
      this.currScale = slowScale;
    }
  }

  handlePinchEnd(e) {
    if (this.currScale === 1 && !this.isZoom) return;
    const { sourceElement, pinchToCloseThreshold } = this.props;

    const currScale = this.currScale;
    const pivotScale = this.isZoom ? this.covertScale(currScale, false) : currScale;
    const maxPivotScale = this.maxPivotScale;

    if (pivotScale < maxPivotScale) {
      const currCenterPos = this.getAnimWrapperCenterPos(pivotScale);
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);
      const currXPos = currCenterPos.x + this.preservedOffset.x + pinchDelta.x;
      const currYPos = currCenterPos.y + this.preservedOffset.y + pinchDelta.y;
      if (pivotScale < pinchToCloseThreshold && sourceElement !== undefined) {
        const start = { x: currXPos, y: currYPos, scale: currScale, opacity: pivotScale };
        this.requestOutAnimation(start, null, this.resetZoomStatus);
      } else if (pivotScale < 1) {
        const initCenterPos = this.getAnimWrapperCenterPos();
        const initScale = this.isZoom ? this.covertScale(1, true) : 1;
        requestAnimation(
          { x: currXPos, y: currYPos, scale: currScale, opacity: pivotScale },
          { x: initCenterPos.x, y: initCenterPos.y, scale: initScale, opacity: 1 },
          BOUNCE_BACK_DURATION,
          'easeOutCubic',
          (pos) => {
            this.applyOverlayOpacity(pos.opacity);
            this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
          },
          () => this.resetZoomStatus(false),
        );
      } else {
        const nextScale = currScale;
        this.preservedOffset.x += pinchDelta.x;
        this.preservedOffset.y += pinchDelta.y;
        this.adjustItemPosition(currScale, nextScale, { x: currXPos, y: currYPos });
      }
    } else {
      const nextScale = this.isZoom ? this.props.maxZoomScale : maxPivotScale;
      const slowScale = this.isZoom ? this.covertScale(currScale, false) : currScale;
      const currCenterPos = this.getAnimWrapperCenterPos(slowScale);
      const slowZoomScale = this.maxEventScale + ((e.scale - this.maxEventScale) * 0.1);
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, slowZoomScale);

      const currXPos = currCenterPos.x + this.preservedOffset.x + pinchDelta.x;
      const currYPos = currCenterPos.y + this.preservedOffset.y + pinchDelta.y;

      const maxCenterPos = this.getAnimWrapperCenterPos(maxPivotScale);

      this.preservedOffset.x = this.maxZoomPos.x - maxCenterPos.x;
      this.preservedOffset.y = this.maxZoomPos.y - maxCenterPos.y;

      this.adjustItemPosition(currScale, nextScale, { x: currXPos, y: currYPos }, this.maxZoomPos);
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
        onPinchStart={this.handlePinchStart}
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
            style={this.getItemDimension()}
            innerRef={(node) => { this.image = node; }}
          />
        </AnimWrapper>
      </EnhancedWrapper>
    );
  }
}

ItemHolder.displayName = 'React-Photo-Swipe__ItemHolder';

ItemHolder.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired,
  itemIndex: PropTypes.number.isRequired,
  currIndex: PropTypes.number.isRequired,
  indexDiff: PropTypes.number.isRequired,
  sourceElement: isDomElement,
  viewportSize: PropTypes.object,
  overlay: PropTypes.object,

  loop: PropTypes.bool,
  spacing: PropTypes.number,
  showAnimateDuration: PropTypes.number,
  hideAnimateDuration: PropTypes.number,
  swipeToCloseThreshold: PropTypes.number,
  pinchToCloseThreshold: PropTypes.number,
  maxZoomScale: PropTypes.number,

  onPanStart: PropTypes.func,
  onPinchStart: PropTypes.func,
  onPinch: PropTypes.func,

  onTap: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func.isRequired,
  onPan: PropTypes.func.isRequired,
  onSwipe: PropTypes.func.isRequired,
  onInnerClose: PropTypes.func.isRequired,
};
