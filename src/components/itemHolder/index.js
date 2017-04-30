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
import { isDomElement } from '../../utils';
import requestAnimation from '../../utils/animation';

const EnhancedWrapper = withGesture(Wrapper);

export default class ItemHolder extends Component {

  constructor(props) {
    super(props);

    this.isZoom = false;
    this.currScale = 1;
    // Stored for calculate `realScale` based on prevScale and currentScale
    this.scaleRatio = undefined;

    // Previous panning position only for panning zoomed item
    this.currPos = this.getAnimWrapperCenterPos();
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

  getItemDimension(zoomed) {
    const { item } = this.props;
    const fitRatio = this.fitRatio;
    return {
      width: zoomed ? item.width : Math.round(fitRatio * item.width),
      height: zoomed ? item.height : Math.round(fitRatio * item.height),
    };
  }

  getItemBounds(zoomed) {
    const { viewportSize } = this.props;
    const itemDimension = this.getItemDimension(zoomed);
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

  requestInAnimation() {
    const { currIndex, sourceElement, showAnimateDuration } = this.props;
    let sStyle = 0;
    let eStyle = 1;
    if (sourceElement !== undefined) {
      const origItemDimension = this.getItemDimension();
      const initCenterPos = this.getAnimWrapperCenterPos();
      const rect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      sStyle = {
        x: rect.left,
        y: rect.top,
        scale: rect.width / origItemDimension.width,
        opacity: 0,
      };
      eStyle = {
        x: initCenterPos.x,
        y: initCenterPos.y,
        scale: 1,
        opacity: 1,
      };
    }
    requestAnimation(
      sStyle,
      eStyle,
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
    const sStyle = startStyle;
    let eStyle = endStyle; // default endStyle --> swipe out of top / bottom
    if (sourceElement !== undefined) {
      const currItemDimension = this.getItemDimension(this.isZoom);
      const rect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      eStyle = {
        x: rect.left,
        y: rect.top,
        scale: rect.width / currItemDimension.width,
        opacity: 0,
      };
    }
    requestAnimation(
      sStyle,
      eStyle,
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
 * @param {Object} center - Pinch two finger center point position
 * @param {Number} scale  - Pinch scale, always fresh when start new Pinch
 */
  calculatePinchDelta(center, scale) {
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
   * @description heck current position whether out of 4 bounds
   * `left` or `top` > 0 means out of left bound or top bound
   * `right` or `bottom` < 0 means out of right bound or bottom bound
   */
  calculatePanOffset(currPos, bound) { // eslint-disable-line class-methods-use-this
    return {
      left: currPos.x - bound.x.left,
      right: currPos.x - bound.x.right,
      top: currPos.y - bound.y.top,
      bottom: currPos.y - bound.y.bottom,
    };
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

  handleTap(e) {
    this.props.onTap(e);
  }

  handleDoubleTap(e) {
    // console.log('doubleTap');
    this.props.onDoubleTap(e);
  }

  handlePanStart(e) {
    if (this.props.onPanStart) {
      this.props.onPanStart(e);
    }
  }

  /**
   *
   * @param {Object} e - Processed `Pan` event object
   * @param {String} e.direction - `lr` or `ud`
   * @param {Object} e.delta - { x, y, accX, accY }
   */
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
      const offset = this.calculatePanOffset({ x: currXPos, y: currYPos }, bounds);

      if (offset.left > 0 || offset.right < 0) {
        this.outOfXBound = true;
        if (offset.left > 0) {
          currXPos = bounds.x.left + (offset.left * PAN_FRICTION_LEVEL);
        } else {
          currXPos = bounds.x.right + (offset.right * PAN_FRICTION_LEVEL);
        }
      }

      if (offset.top > 0 || offset.bottom < 0) {
        this.outOfYBound = true;
        if (offset.top > 0) {
          currYPos = bounds.y.top + (offset.top * PAN_FRICTION_LEVEL);
        } else {
          currYPos = bounds.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL);
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

      if (this.outOfXBound || this.outOfYBound) {
        const bounds = this.getItemBounds(true);
        const offset = this.calculatePanOffset({ x: currXPos, y: currYPos }, bounds);

        if (offset.left > 0 || offset.right < 0) {
          if (offset.left > 0) {
            nextXPos = bounds.x.left;
            currXPos = bounds.x.left + (offset.left * PAN_FRICTION_LEVEL);
          } else {
            nextXPos = bounds.x.right;
            currXPos = bounds.x.right + (offset.right * PAN_FRICTION_LEVEL);
          }
        }
        if (offset.top > 0 || offset.bottom < 0) {
          if (offset.top > 0) {
            nextYPos = bounds.y.top;
            currYPos = bounds.y.top + (offset.top * PAN_FRICTION_LEVEL);
          } else {
            nextYPos = bounds.y.bottom;
            currYPos = bounds.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL);
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
    if (!this.isZoom) {
      const { viewportSize, swipeToCloseThreshold } = this.props;
      const direction = e.direction;
      const delta = e.delta;
      const absAccY = Math.abs(delta.accY);
      if ((direction === 'Up' || direction === 'Down')) {
        const origItemDimension = this.getItemDimension();
        const initCenterPos = this.getAnimWrapperCenterPos();

        const sStyle = {
          x: initCenterPos.x,
          y: initCenterPos.y + delta.accY,
          scale: 1,
          opacity: Math.max(1 - (absAccY / viewportSize.height), 0),
        };
        let eStyle;

        const isExceed = absAccY > (swipeToCloseThreshold * viewportSize.height);
        if (isExceed) {
          const animOutCallback = () => {
            this.props.onInnerClose();
            this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
          };
          eStyle = direction === 'Up'
          ? { x: initCenterPos.x, y: -origItemDimension.height, scale: 1, opacity: 0 }
          : { x: initCenterPos.x, y: (initCenterPos.y * 2) + origItemDimension.height, scale: 1, opacity: 0 }; // eslint-disable-line max-len
          this.requestOutAnimation(sStyle, eStyle, animOutCallback);
        } else {
          eStyle = { x: initCenterPos.x, y: initCenterPos.y, opacity: 1 };
          requestAnimation(
            sStyle,
            eStyle,
            BOUNCE_BACK_DURATION,
            'easeOutCubic',
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
    const { item, maxZoomLevel } = this.props;

    if (this.scaleRatio === undefined) {
      this.scaleRatio = this.currScale / e.scale;
    }

    const origItemDimension = this.getItemDimension();

    const realScale = e.scale * this.scaleRatio;
    const pivotScale = this.isZoom
                       ? ((realScale * item.width) / origItemDimension.width)
                       : realScale;

    if (pivotScale < (maxZoomLevel + ZOOM_LEVEL_INCRE)) {
      const currPos = this.getAnimWrapperCenterPos(origItemDimension, pivotScale);
      const delta = this.calculatePinchDelta(e.center, e.scale);
      const nextXPos = currPos.x + delta.x;
      const nextYPos = currPos.y + delta.y;

      this.applyAnimWrapperTransform(nextXPos, nextYPos, realScale);
      this.currScale = realScale;
      if (pivotScale < 1) {
        this.applyOverlayOpacity(pivotScale);
      }
    }
  }

  handlePinchEnd(e) {
    const { item, sourceElement, pinchToCloseThresholder, maxZoomLevel } = this.props;

    const origItemDimension = this.getItemDimension();
    const zoomedItemDimension = this.getItemDimension(true);

    // the real scale that will change after item zoomed
    const realScale = Math.min(this.currScale, maxZoomLevel + ZOOM_LEVEL_INCRE);
    // pivot that based on original item dimension
    const pivotScale = this.isZoom
                       ? ((realScale * item.width) / origItemDimension.width)
                       : realScale;

    const currPos = this.getAnimWrapperCenterPos(origItemDimension, pivotScale);
    const delta = this.calculatePinchDelta(e.center, e.scale);
    const currXPos = currPos.x + delta.x;
    const currYPos = currPos.y + delta.y;

    if (pivotScale < 1) {
      const initCenterPos = this.getAnimWrapperCenterPos();
      // Reset image size and animation wrapper position
      const resetPinchCallback = (innerClose = true) => {
        if (innerClose) {
          this.props.onInnerClose();
        }
        this.applyImageSize(origItemDimension);
        this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
        this.isZoom = false;
        this.currScale = 1;
        this.scaleRatio = undefined;
        this.currPos = this.getAnimWrapperCenterPos();
      };
      if (pivotScale < pinchToCloseThresholder && sourceElement !== undefined) {
        const sStyle = { x: currXPos, y: currYPos, scale: realScale, opacity: pivotScale };
        this.requestOutAnimation(sStyle, null, resetPinchCallback);
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
          () => resetPinchCallback(false),
        );
      }
    } else {
      let nextXPos = currXPos;
      let nextYPos = currYPos;
      const currScale = realScale;
      const nextScale = this.isZoom
                        ? Math.min(realScale, (maxZoomLevel * origItemDimension.width) / zoomedItemDimension.width) // eslint-disable-line
                        : Math.min(realScale, maxZoomLevel);

      const bounds = this.getItemBounds(false);

      // Adjust zoomed image position
      const offset = this.calculatePanOffset({ x: currXPos, y: currYPos }, bounds);

      const centerPos = this.isZoom
                        ? this.getAnimWrapperCenterPos(zoomedItemDimension, nextScale)
                        : this.getAnimWrapperCenterPos(origItemDimension, nextScale);

      if (offset.left > 0 || offset.right < 0) {
        nextXPos = centerPos.x;
      }

      if (offset.top > 0 || offset.bottom < 0) {
        nextYPos = centerPos.y;
      }

      requestAnimation(
        { x: currXPos, y: currYPos, scale: currScale },
        { x: nextXPos, y: nextYPos, scale: nextScale },
        BOUNCE_BACK_DURATION,
        'easeOutCubic',
        pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
        () => {
          if (!this.isZoom) {
            const zoomedScale = (nextScale * origItemDimension.width) / item.width;
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
  pinchToCloseThresholder: PropTypes.number,
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
