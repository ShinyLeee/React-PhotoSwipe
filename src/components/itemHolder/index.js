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
    this.currScale = 1;
    this.scaleRatio = undefined;
    // Previous position for zoom gesture
    this.currPos = this.getAnimWrapperCenterPos();
    // Composed by panning and pinch delta
    this.movedDelta = getEmptyPoint();
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

  getItemBounds(isZoom) {
    const { viewportSize } = this.props;
    const itemDimension = this.getItemDimension(isZoom);
    const currCenterPos = this.getAnimWrapperCenterPos(itemDimension, this.currScale);

    const realItemWidth = itemDimension.width * this.currScale;
    const realItemHeight = itemDimension.height * this.currScale;

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
  getAnimWrapperCenterPos(dimension = this.getItemDimension(), scale = 1) {
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
      const currItemDimension = this.getItemDimension(this.isZoom);
      const rect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      end = {
        x: rect.left,
        y: rect.top,
        scale: rect.width / currItemDimension.width,
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

/**
 *
 * @param {Object} center - center point position
 * @param {Number} scale  - zoom scale, always fresh when start new zoom gesture
 */
  calculateZoomDelta(center, scale) {
    const { viewportSize } = this.props;
    const screenCenter = {
      x: Math.round(viewportSize.width * 0.5),
      y: Math.round(viewportSize.height * 0.5),
    };
    return {
      x: Math.round((screenCenter.x - center.x) * (scale - 1)),
      y: Math.round((screenCenter.y - center.y) * (scale - 1)),
    };
  }

  /**
   * @description check current position whether out of 4 bounds
   * `left` or `top` > 0 means out of left bound or top bound
   * `right` or `bottom` < 0 means out of right bound or bottom bound
   */
  calculateOffset(currPos, bound) { // eslint-disable-line class-methods-use-this
    return {
      left: currPos.x - bound.x.left,
      right: currPos.x - bound.x.right,
      top: currPos.y - bound.y.top,
      bottom: currPos.y - bound.y.bottom,
    };
  }

  resetZoomStatus(innerClose = true) {
    if (innerClose) {
      this.props.onInnerClose();
    }
    const origItemDimension = this.getItemDimension();
    const initCenterPos = this.getAnimWrapperCenterPos();
    this.applyImageSize(origItemDimension);
    this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
    this.isZoom = false;
    this.currScale = 1;
    this.scaleRatio = undefined;
    this.movedDelta = getEmptyPoint();
    this.currPos = initCenterPos;
  }

  handleTap(e) {
    this.props.onTap(e);
  }

  handleDoubleTap(e) {
    let start;
    let end;
    const movedDelta = this.movedDelta;
    const origItemDimension = this.getItemDimension();
    const zoomedItemDimension = this.getItemDimension(true);
    const initCenterPos = this.getAnimWrapperCenterPos();
    if (!this.isZoom) {
      const nextScale = zoomedItemDimension.width / origItemDimension.width;
      const nextCenterPos = this.getAnimWrapperCenterPos(origItemDimension, nextScale);
      const delta = this.calculateZoomDelta(e.position, nextScale);
      movedDelta.x = delta.x;
      movedDelta.y = delta.y;
      start = { x: initCenterPos.x, y: initCenterPos.y, scale: this.currScale };
      end = { x: nextCenterPos.x + delta.x, y: nextCenterPos.y + delta.y, scale: nextScale };
    } else {
      const currScale = this.currScale;
      const currCenterPos = this.getAnimWrapperCenterPos(zoomedItemDimension, currScale);
      const initScale = origItemDimension.width / zoomedItemDimension.width;
      start = { x: currCenterPos.x + movedDelta.x, y: currCenterPos.y + movedDelta.y, scale: currScale }; // eslint-disable-line max-len
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

      const bounds = this.getItemBounds(true);
      // If panning out of item bounds we should make it very hard to continue pan
      const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

      if (offset.left > 0 || offset.right < 0) {
        this.outOfXBound = true;
        if (offset.left > 0) {
          currXPos = bounds.x.left + (offset.left * FRICTION_LEVEL);
        } else {
          currXPos = bounds.x.right + (offset.right * FRICTION_LEVEL);
        }
      }

      if (offset.top > 0 || offset.bottom < 0) {
        this.outOfYBound = true;
        if (offset.top > 0) {
          currYPos = bounds.y.top + (offset.top * FRICTION_LEVEL);
        } else {
          currYPos = bounds.y.bottom + (offset.bottom * FRICTION_LEVEL);
        }
      }
      this.applyAnimWrapperTransform(currXPos, currYPos, this.currScale);
    } else {
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

      this.movedDelta.x += e.delta.accX;
      this.movedDelta.y += e.delta.accY;

      if (this.outOfXBound || this.outOfYBound) {
        const bounds = this.getItemBounds(true);
        const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

        const zoomedItemDimension = this.getItemDimension(true);
        const currCenterPos = this.getAnimWrapperCenterPos(zoomedItemDimension, this.currScale);

        if (offset.left > 0 || offset.right < 0) {
          if (offset.left > 0) {
            nextXPos = bounds.x.left;
            currXPos = bounds.x.left + (offset.left * FRICTION_LEVEL);
            this.movedDelta.x = bounds.x.left - currCenterPos.x;
          } else {
            nextXPos = bounds.x.right;
            currXPos = bounds.x.right + (offset.right * FRICTION_LEVEL);
            this.movedDelta.x = bounds.x.right - currCenterPos.x;
          }
        }
        if (offset.top > 0 || offset.bottom < 0) {
          if (offset.top > 0) {
            nextYPos = bounds.y.top;
            currYPos = bounds.y.top + (offset.top * FRICTION_LEVEL);
            this.movedDelta.y = bounds.y.top - currCenterPos.y;
          } else {
            nextYPos = bounds.y.bottom;
            currYPos = bounds.y.bottom + (offset.bottom * FRICTION_LEVEL);
            this.movedDelta.y = bounds.y.bottom - currCenterPos.y;
          }
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
    // TODO bug: too fast swipe when zooming in the first time will trigger this,
    // cuz this.isZoom is still false.
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
    const { maxZoomLevel } = this.props;

    if (this.scaleRatio === undefined) {
      this.scaleRatio = this.currScale / e.scale;
    }

    const origItemDimension = this.getItemDimension();
    const zoomedItemDimension = this.getItemDimension(true);

    const maxLevel = (maxZoomLevel * zoomedItemDimension.width) / origItemDimension.width;

    // real scale that will manipulate item style
    const realScale = e.scale * this.scaleRatio;
    // pivot scale that based on original item dimension
    const pivotScale = this.isZoom
                       ? (realScale * zoomedItemDimension.width) / origItemDimension.width
                       : realScale;

    if (pivotScale < maxLevel) {
      if (pivotScale < 1) {
        this.applyOverlayOpacity(pivotScale);
      }
      const currCenterPos = this.getAnimWrapperCenterPos(origItemDimension, pivotScale);
      const delta = this.calculateZoomDelta(e.center, e.scale);

      const nextXPos = currCenterPos.x + this.movedDelta.x + delta.x;
      const nextYPos = currCenterPos.y + this.movedDelta.y + delta.y;

      this.applyAnimWrapperTransform(nextXPos, nextYPos, realScale);
      this.currScale = realScale;
    } else {
      let slowScale = maxLevel + ((pivotScale - maxLevel) * FRICTION_LEVEL);
      const currCenterPos = this.getAnimWrapperCenterPos(origItemDimension, slowScale);
      const delta = this.calculateZoomDelta(e.center, e.scale);

      const nextXPos = currCenterPos.x + this.movedDelta.x + delta.x;
      const nextYPos = currCenterPos.y + this.movedDelta.y + delta.y;

      // if zoomed we need to make slowScale based on zoomedItemDimension
      if (this.isZoom) {
        slowScale = (slowScale * origItemDimension.width) / zoomedItemDimension.width;
      }
      this.applyAnimWrapperTransform(nextXPos, nextYPos, slowScale);
      this.currScale = slowScale;
    }
  }

  handlePinchEnd(e) {
    const { sourceElement, pinchToCloseThreshold, maxZoomLevel } = this.props;

    const origItemDimension = this.getItemDimension();
    const zoomedItemDimension = this.getItemDimension(true);

    const maxLevel = (maxZoomLevel * zoomedItemDimension.width) / origItemDimension.width;

    const realScale = this.currScale;
    const pivotScale = this.isZoom
                       ? (realScale * zoomedItemDimension.width) / origItemDimension.width
                       : realScale;

    const currCenterPos = this.getAnimWrapperCenterPos(origItemDimension, pivotScale);
    const delta = this.calculateZoomDelta(e.center, e.scale);
    const currXPos = currCenterPos.x + this.movedDelta.x + delta.x;
    const currYPos = currCenterPos.y + this.movedDelta.y + delta.y;

    if (pivotScale < 1) {
      const initCenterPos = this.getAnimWrapperCenterPos();
      if (pivotScale < pinchToCloseThreshold && sourceElement !== undefined) {
        const start = { x: currXPos, y: currYPos, scale: realScale, opacity: pivotScale };
        this.requestOutAnimation(start, null, this.resetZoomStatus);
      } else {
        const initScale = this.isZoom ? origItemDimension.width / zoomedItemDimension.width : 1;
        requestAnimation(
          { x: currXPos, y: currYPos, scale: realScale, opacity: pivotScale },
          { x: initCenterPos.x, y: initCenterPos.y, scale: initScale, opacity: 1 },
          BOUNCE_BACK_DURATION,
          'easeOutCubic',
          (pos) => {
            this.applyOverlayOpacity(pos.opacity);
            this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
          },
          () => this.resetZoomStatus(false),
        );
      }
    } else {
      // adjust zoomed item position
      let nextXPos = currXPos;
      let nextYPos = currYPos;
      const currScale = realScale;
      const nextScale = this.isZoom
                        ? Math.min(realScale, (maxLevel * origItemDimension.width) / zoomedItemDimension.width) // eslint-disable-line max-len
                        : Math.min(realScale, maxLevel);

      const bounds = this.getItemBounds(this.isZoom);
      const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

      const nextCenterPos = this.isZoom
                            ? this.getAnimWrapperCenterPos(zoomedItemDimension, nextScale)
                            : this.getAnimWrapperCenterPos(origItemDimension, nextScale);

      this.movedDelta.x = delta.x;
      this.movedDelta.y = delta.y;

      if (offset.left === offset.right) {
        if (offset.top < 0 && offset.bottom > 0) { // overflow top & bottom bounds
          // console.log('overflow top & bottom bounds');
          nextXPos = nextCenterPos.x;
        } else if (offset.top < 0 && offset.bottom < 0) { // overflow top bounds
          // console.log('overflow top bounds');
          nextXPos = nextCenterPos.x;
          nextYPos = bounds.y.bottom;
          this.movedDelta.y = nextCenterPos.y;
        } else if (offset.top > 0 && offset.bottom > 0) { // overflow bottom bounds
          // console.log('overflow bottom bounds');
          nextXPos = nextCenterPos.x;
          nextYPos = bounds.y.top;
          this.movedDelta.y = -nextCenterPos.y;
        }
        this.movedDelta.x = 0;
      }

      if (offset.top === offset.bottom) {
        if (offset.left < 0 && offset.right > 0) { // overflow left & right bounds
          // console.log('overflow left & right bounds');
          nextYPos = nextCenterPos.y;
        } else if (offset.left < 0 && offset.right < 0) { // overflow left bounds
          // console.log('overflow left bounds');
          nextXPos = bounds.x.right;
          nextYPos = nextCenterPos.y;
          this.movedDelta.x = nextCenterPos.x;
        } else if (offset.left > 0 && offset.right > 0) { // overflow right bounds
          // console.log('overflow right bounds');
          nextXPos = bounds.x.left;
          nextYPos = nextCenterPos.y;
          this.movedDelta.x = -nextCenterPos.x;
        }
        this.movedDelta.y = 0;
      }

      requestAnimation(
        { x: currXPos, y: currYPos, scale: currScale },
        { x: nextXPos, y: nextYPos, scale: nextScale },
        BOUNCE_BACK_DURATION,
        'sineOut',
        pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
        () => {
          if (!this.isZoom) {
            const zoomedScale = (nextScale * origItemDimension.width) / zoomedItemDimension.width;
            this.applyImageSize(zoomedItemDimension);
            this.applyAnimWrapperTransform(nextXPos, nextYPos, zoomedScale);
            this.currScale = zoomedScale;
          } else {
            this.applyAnimWrapperTransform(nextXPos, nextYPos, nextScale);
            this.currScale = nextScale;
          }
          this.scaleRatio = undefined;
          this.currPos.x = nextXPos;
          this.currPos.y = nextYPos;
          this.isZoom = true;
        },
      );
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
  maxZoomLevel: PropTypes.number,

  onPanStart: PropTypes.func,
  onPinchStart: PropTypes.func,
  onPinch: PropTypes.func,

  onTap: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func.isRequired,
  onPan: PropTypes.func.isRequired,
  onSwipe: PropTypes.func.isRequired,
  onInnerClose: PropTypes.func.isRequired,
};
