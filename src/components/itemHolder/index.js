import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EnhancedWrapper, AnimWrapper, PlaceHolder, Image } from './styled';
import { PAN_FRICTION_LEVEL, ZOOM_FRICTION_LEVEL, BOUNCE_BACK_DURATION } from '../../utils/constant';
import { getEmptyPoint, isDomElement } from '../../utils';
import { animate } from '../../utils/animation';

export default class ItemHolder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      loadError: false,
    };
    this.isZoom = false;
    this.scaleRatio = undefined;
    this.currScale = 1; // real scale that manipulate item style
    this.currPos = this.getAnimWrapperCenterPos(); // Previous position for zoom gesture
    this.outOfBounds = false;
    this.preservedOffset = getEmptyPoint(); // Composed by panning and pinch delta
    this.maxZoomPos = getEmptyPoint(); // Bounce back position if exceed maxZoomScale
    this.maxEventScale = 0;
    this.maxPivotScale = this.covertScale(props.maxZoomScale, false);
    this.handleTap = this.handleTap.bind(this);
    this.handleDoubleTap = this.handleDoubleTap.bind(this);
    this.handlePanStart = this.handlePanStart.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handlePanEnd = this.handlePanEnd.bind(this);
    this.handlePinchStart = this.handlePinchStart.bind(this);
    this.handlePinch = this.handlePinch.bind(this);
    this.handlePinchEnd = this.handlePinchEnd.bind(this);
  }

  componentDidMount() {
    if (this.isCurrentSlide) {
      this.props.beforeZoomIn(true); // initial zoom in
      this.requestInAnimation(() => this.props.afterZoomIn(true));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.zoomOut !== nextProps.zoomOut) {
      if (nextProps.zoomOut && this.isCurrentSlide) {
        this.props.beforeZoomOut();
        const initCenterPos = this.getAnimWrapperCenterPos();
        const start = { x: initCenterPos.x, y: initCenterPos.y, scale: 1, opacity: 1 };
        this.requestOutAnimation(start, null, () => this.resetZoomStatus(true));
      }
    }
  }

  shouldComponentUpdate() {
    return true; // TODO
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open !== this.props.open) {
      if (this.props.open && this.isCurrentSlide) {
        this.props.beforeZoomIn(false);
        this.requestInAnimation(() => this.props.afterZoomIn(false));
      }
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
  getItemBounds(scale) {
    const { viewportSize } = this.props;
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

  get isCurrentSlide() {
    return this.props.itemIndex === this.props.currIndex;
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
    if (this.image) {
      this.image.style.width = `${dimension.width}px`;
      this.image.style.height = `${dimension.height}px`;
    }
  }

  calculateOffset(currPos, bound) { // eslint-disable-line class-methods-use-this
    return {
      left: currPos.x - bound.x.left, // left < 0 means overflow left bound
      right: currPos.x - bound.x.right, // right > 0 means overflow right bound
      top: currPos.y - bound.y.top, // top < 0 means overflow top bound
      bottom: currPos.y - bound.y.bottom, // bottom > 0 means overflow bottom bound
    };
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

  calculatePinchPosition(scale, pinchDelta) {
    const currCenterPos = this.getAnimWrapperCenterPos(scale);
    return {
      x: Math.round(currCenterPos.x + this.preservedOffset.x + pinchDelta.x),
      y: Math.round(currCenterPos.y + this.preservedOffset.y + pinchDelta.y),
    };
  }

  covertScale(scale, toZoomScale) {
    const fitRatio = this.fitRatio;
    return toZoomScale ? scale * fitRatio : scale * (1 / fitRatio);
  }

  resetZoomStatus(isZoomOut) {
    const initCenterPos = this.getAnimWrapperCenterPos();
    this.isZoom = false;
    this.scaleRatio = undefined;
    this.currScale = 1;
    this.preservedOffset = getEmptyPoint();
    this.currPos = initCenterPos;
    this.applyImageSize(this.getItemDimension());
    this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y, 1);
    if (isZoomOut) {
      this.props.afterZoomOut();
    }
  }

  requestInAnimation(callback) {
    const { currIndex, sourceElement, showHideDuration } = this.props;
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
    animate(
      'itemHolder__In',
      start,
      end,
      showHideDuration,
      'easeOutCubic',
      (pos) => {
        if (sourceElement !== undefined) {
          this.applyOverlayOpacity(pos.opacity);
          this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
        } else {
          this.applyOverlayOpacity(pos);
        }
      },
      () => callback && callback(),
    );
  }

  requestZoomAnimation(currScale, nextScale, currPos, nextPos) {
    const bounds = this.getItemBounds(nextScale);
    const offset = this.calculateOffset(nextPos, bounds);

    const start = Object.assign({}, currPos, { scale: currScale });
    const end = Object.assign({}, nextPos, { scale: nextScale });

    const nextCenterPos = this.getAnimWrapperCenterPos(nextScale, this.isZoom);

    if ((offset.left === offset.right) || (offset.left > 0 && offset.right < 0)) {
      end.x = nextCenterPos.x;
      this.preservedOffset.x = 0;
    } else if (offset.left > 0 && offset.right > 0) {
      end.x = bounds.x.left;
      this.preservedOffset.x = -nextCenterPos.x;
    } else if (offset.left < 0 && offset.right < 0) {
      end.x = bounds.x.right;
      this.preservedOffset.x = nextCenterPos.x;
    }

    if ((offset.top === offset.bottom) || (offset.top > 0 && offset.bottom < 0)) {
      end.y = nextCenterPos.y;
      this.preservedOffset.y = 0;
    } else if (offset.top > 0 && offset.bottom > 0) {
      end.y = bounds.y.top;
      this.preservedOffset.y = -nextCenterPos.y;
    } else if (offset.top < 0 && offset.bottom < 0) {
      end.y = bounds.y.bottom;
      this.preservedOffset.y = nextCenterPos.y;
    }
    animate(
      'itemHolder__Zoom',
      start,
      end,
      BOUNCE_BACK_DURATION,
      'sineOut',
      pos => this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale),
      () => {
        if (!this.isZoom) {
          const zoomedScale = this.covertScale(nextScale, true);
          const zoomedItemDimension = this.getItemDimension(true);
          this.applyImageSize(zoomedItemDimension);
          this.applyAnimWrapperTransform(end.x, end.y, zoomedScale);
          this.currScale = zoomedScale;
        } else {
          this.applyAnimWrapperTransform(end.x, end.y, nextScale);
          this.currScale = nextScale;
        }
        this.isZoom = true;
        this.scaleRatio = undefined;
        this.currPos.x = end.x;
        this.currPos.y = end.y;
        this.maxZoomPos = getEmptyPoint();
      },
    );
  }

  requestPanBackAnimation(currPos, callback) {
    const bounds = this.getItemBounds(this.currScale);
    const offset = this.calculateOffset(currPos, bounds);
    const currCenterPos = this.getAnimWrapperCenterPos(this.currScale, true);

    const start = Object.assign({}, currPos);
    const end = Object.assign({}, currPos);

    if (offset.left > 0) {
      start.x = Math.round(bounds.x.left + (offset.left * PAN_FRICTION_LEVEL));
      end.x = bounds.x.left;
      this.preservedOffset.x = bounds.x.left - currCenterPos.x;
    } else if (offset.right < 0) {
      start.x = Math.round(bounds.x.right + (offset.right * PAN_FRICTION_LEVEL));
      end.x = bounds.x.right;
      this.preservedOffset.x = bounds.x.right - currCenterPos.x;
    }

    if (offset.top > 0) {
      start.y = Math.round(bounds.y.top + (offset.top * PAN_FRICTION_LEVEL));
      end.y = bounds.y.top;
      this.preservedOffset.y = bounds.y.top - currCenterPos.y;
    } else if (offset.bottom < 0) {
      start.y = Math.round(bounds.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL));
      end.y = bounds.y.bottom;
      this.preservedOffset.y = bounds.y.bottom - currCenterPos.y;
    }
    animate(
      'itemHolder__PanBack',
      start,
      end,
      BOUNCE_BACK_DURATION,
      'sineOut',
      pos => this.applyAnimWrapperTransform(pos.x, pos.y, this.currScale),
      () => callback && callback(end),
    );
  }

  requestResetAnimation(start, callback) {
    const initCenterPos = this.getAnimWrapperCenterPos();
    const initScale = this.isZoom ? this.covertScale(1, true) : 1;
    const end = Object.assign({}, initCenterPos, { scale: initScale, opacity: 1 });
    animate(
      'itemHolder__Reset',
      start,
      end,
      BOUNCE_BACK_DURATION,
      'sineOut',
      (pos) => {
        this.applyOverlayOpacity(pos.opacity);
        this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
      },
      () => callback && callback(),
    );
  }

  requestOutAnimation(start, end, callback) {
    const { currIndex, sourceElement, showHideDuration } = this.props;
    if (!end && sourceElement !== undefined) {
      const itemDimension = this.getItemDimension(this.isZoom);
      const thumbRect = sourceElement.childNodes[currIndex].getBoundingClientRect();
      end = { // eslint-disable-line no-param-reassign
        x: thumbRect.left,
        y: thumbRect.top,
        scale: thumbRect.width / itemDimension.width,
        opacity: 0,
      };
    }
    animate(
      'itemHolder__Out',
      start,
      end,
      showHideDuration,
      'easeOutCubic',
      (pos) => {
        this.applyOverlayOpacity(pos.opacity);
        this.applyAnimWrapperTransform(pos.x, pos.y, pos.scale);
      },
      () => callback && callback(),
    );
  }

  handleTap(e) {
    this.props.onTap(e, this.isZoom);
  }

  handleDoubleTap(e) {
    if (!this.state.loaded || this.state.loadError) return;
    if (!this.isZoom) {
      const maxPivotScale = this.maxPivotScale;
      const initCenterPos = this.getAnimWrapperCenterPos();
      const pinchDelta = this.calculatePinchDelta(e.position, e.position, maxPivotScale);
      this.maxZoomPos = this.calculatePinchPosition(maxPivotScale, pinchDelta);
      this.maxEventScale = maxPivotScale;
      this.preservedOffset.x = pinchDelta.x;
      this.preservedOffset.y = pinchDelta.y;
      this.requestZoomAnimation(1, maxPivotScale, initCenterPos, this.maxZoomPos);
    } else {
      const currScale = Math.min(this.currScale, this.props.maxZoomScale);
      const start = Object.assign({}, this.currPos, { scale: currScale });
      this.requestResetAnimation(start, () => {
        this.resetZoomStatus(false);
        this.props.afterReset('doubleTap');
      });
    }
    this.props.onDoubleTap(e, this.isZoom);
  }

  handlePanStart(e) {
    this.props.onPanStart(e, this.isZoom);
  }

  handlePan(e) {
    const { viewportSize } = this.props;
    if (this.isZoom) {
      let currXPos = this.currPos.x + e.delta.accX;
      let currYPos = this.currPos.y + e.delta.accY;

      const bounds = this.getItemBounds(this.currScale);
      const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);

      if (offset.left > 0 || offset.right < 0 || offset.top > 0 || offset.bottom < 0) {
        this.outOfBounds = true;
        if (offset.left > 0) { // out of left bounds
          currXPos = Math.round(bounds.x.left + (offset.left * PAN_FRICTION_LEVEL));
        } else if (offset.right < 0) { // out of right bounds
          currXPos = Math.round(bounds.x.right + (offset.right * PAN_FRICTION_LEVEL));
        }
        if (offset.top > 0) { // out of top bounds
          currYPos = Math.round(bounds.y.top + (offset.top * PAN_FRICTION_LEVEL));
        } else if (offset.bottom < 0) { // out of bottom bounds
          currYPos = Math.round(bounds.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL));
        }
      }
      this.applyAnimWrapperTransform(currXPos, currYPos, this.currScale);
    } else {
      if (e.direction === 'ud') {
        const absAccY = Math.abs(e.delta.accY);
        const opacity = Math.max(1 - (absAccY / viewportSize.height), 0);
        const initCenterPos = this.getAnimWrapperCenterPos();
        this.applyOverlayOpacity(opacity);
        this.applyAnimWrapperTransform(initCenterPos.x, initCenterPos.y + e.delta.accY, 1);
      }
      this.props.onPan(e);
    }
  }

  // TODO add scrolling animation to zoomed item when swipe
  handlePanEnd(e) {
    if (this.isZoom) {
      this.preservedOffset.x += e.delta.accX;
      this.preservedOffset.y += e.delta.accY;
      if (this.outOfBounds) {
        const currPos = {
          x: this.currPos.x + e.delta.accX,
          y: this.currPos.y + e.delta.accY,
        };
        this.requestPanBackAnimation(currPos, (pos) => {
          this.currPos.x = pos.x;
          this.currPos.y = pos.y;
          this.outOfBounds = false;
        });
      } else {
        this.currPos.x += e.delta.accX;
        this.currPos.y += e.delta.accY;
      }
    } else if (e.direction === 'Up' || e.direction === 'Down') {
      const { swipeVelocity, sourceElement, viewportSize } = this.props;
      const absVertDelta = Math.abs(e.delta.accY);
      const initCenterPos = this.getAnimWrapperCenterPos();
      const start = {
        x: initCenterPos.x,
        y: initCenterPos.y + e.delta.accY,
        scale: 1,
        opacity: Math.max(1 - (absVertDelta / viewportSize.height), 0),
      };
      if (e.velocity > swipeVelocity || (absVertDelta > viewportSize.height * 0.5)) {
        // Swipe out to top / bottom if sourceElement not defined.
        const origDimension = this.getItemDimension();
        const end = sourceElement === undefined ? {
          x: initCenterPos.x,
          y: e.direction === 'Up' ? -origDimension.height : (initCenterPos.y * 2) + origDimension.height,
          scale: 1,
          opacity: 0,
        } : null;
        this.props.beforeZoomOut();
        this.requestOutAnimation(start, end, () => this.resetZoomStatus(true));
      } else {
        this.requestResetAnimation(start, () => this.props.afterReset('panEnd'));
      }
    }
    this.props.onPanEnd(e, this.isZoom);
  }

  handlePinchStart(e) {
    this.props.onPinchStart(e, this.isZoom);
  }

  handlePinch(e) {
    if (!this.state.loaded || this.state.loadError) return;

    if (this.scaleRatio === undefined) {
      this.scaleRatio = this.currScale / e.scale;
    }
    // real scale that manipulate item style
    const realScale = e.scale * this.scaleRatio;
    // pivot scale that always based on original item dimension
    const pivotScale = this.isZoom ? this.covertScale(realScale, false) : realScale;
    const maxPivotScale = this.maxPivotScale;

    if (pivotScale < maxPivotScale) {
      if (pivotScale < 1) {
        this.applyOverlayOpacity(pivotScale);
      }
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);
      const nextPos = this.calculatePinchPosition(pivotScale, pinchDelta);
      this.applyAnimWrapperTransform(nextPos.x, nextPos.y, realScale);
      this.currScale = realScale;
    } else if (pivotScale > maxPivotScale) {
      if (this.maxZoomPos.x === null || this.maxZoomPos.y === null) {
        const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);
        this.maxZoomPos = this.calculatePinchPosition(maxPivotScale, pinchDelta);
        this.maxEventScale = e.scale;
      }
      let slowScale = maxPivotScale + ((pivotScale - maxPivotScale) * ZOOM_FRICTION_LEVEL);
      const slowZoomScale = this.maxEventScale + ((e.scale - this.maxEventScale) * ZOOM_FRICTION_LEVEL); // eslint-disable-line max-len
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, slowZoomScale);
      const nextPos = this.calculatePinchPosition(slowScale, pinchDelta);
      if (this.isZoom) {
        slowScale = this.covertScale(slowScale, true);
      }
      this.applyAnimWrapperTransform(nextPos.x, nextPos.y, slowScale);
      this.currScale = slowScale;
    }
  }

  handlePinchEnd(e) {
    if (!this.state.loaded || this.state.loadError) return;

    const { sourceElement, pinchToCloseThreshold } = this.props;

    const currScale = this.currScale;
    const pivotScale = this.isZoom ? this.covertScale(currScale, false) : currScale;
    const maxPivotScale = this.maxPivotScale;

    if (pivotScale < maxPivotScale) {
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, e.scale);
      const currPos = this.calculatePinchPosition(pivotScale, pinchDelta);
      const start = Object.assign({}, currPos, { scale: currScale, opacity: pivotScale });
      if (pivotScale < pinchToCloseThreshold && sourceElement !== undefined) {
        this.props.beforeZoomOut();
        this.requestOutAnimation(start, null, () => this.resetZoomStatus(true));
      } else if (pivotScale < 1) {
        this.requestResetAnimation(start, () => {
          this.resetZoomStatus(false);
          this.props.afterReset('pinch');
        });
      } else {
        const nextScale = currScale;
        const nextPos = Object.assign({}, currPos);
        this.preservedOffset.x += pinchDelta.x;
        this.preservedOffset.y += pinchDelta.y;
        this.requestZoomAnimation(currScale, nextScale, currPos, nextPos);
      }
    } else {
      const nextScale = this.isZoom ? this.props.maxZoomScale : maxPivotScale;
      const slowScale = this.isZoom ? this.covertScale(currScale, false) : currScale;
      const slowZoomScale = this.maxEventScale + ((e.scale - this.maxEventScale) * ZOOM_FRICTION_LEVEL); // eslint-disable-line max-len
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, slowZoomScale);
      const currPos = this.calculatePinchPosition(slowScale, pinchDelta);
      this.preservedOffset.x += pinchDelta.x;
      this.preservedOffset.y += pinchDelta.y;
      this.requestZoomAnimation(currScale, nextScale, currPos, this.maxZoomPos);
    }
    this.props.onPinchEnd(e, this.isZoom);
  }

  handleImageLoad(error) {
    this.setState({ loaded: true, loadError: error });
    this.props.onItemLoad(error, this.props.itemIndex);
  }

  render() {
    const { open, item, errorBox } = this.props;
    const origDimension = this.getItemDimension();
    const initCenterPos = this.getAnimWrapperCenterPos();
    return (
      <EnhancedWrapper
        shouldBind={open && this.isCurrentSlide}
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
          {
            item.msrc
            ? <Image src={item.msrc} style={origDimension} />
            : <PlaceHolder style={origDimension} />
          }
          {
            this.state.loadError
            ? <PlaceHolder style={origDimension}>{React.cloneElement(errorBox, { item })}</PlaceHolder> // eslint-disable-line max-len
            : <Image
              src={item.src}
              style={origDimension}
              innerRef={(node) => { this.image = node; }}
              onLoad={() => this.handleImageLoad(false)}
              onError={() => this.handleImageLoad(true)}
            />
          }
        </AnimWrapper>
      </EnhancedWrapper>
    );
  }
}

ItemHolder.displayName = 'React-Photo-Swipe__ItemHolder';

ItemHolder.defaultProps = {
  zoomOut: false,
};

ItemHolder.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired,
  itemIndex: PropTypes.number.isRequired,
  currIndex: PropTypes.number.isRequired,
  indexDiff: PropTypes.number.isRequired,
  viewportSize: PropTypes.object.isRequired,
  sourceElement: isDomElement,
  overlay: isDomElement,
  loop: PropTypes.bool.isRequired,
  errorBox: PropTypes.element.isRequired,
  zoomOut: PropTypes.bool.isRequired,
  spacing: PropTypes.number.isRequired,
  showHideDuration: PropTypes.number.isRequired,
  swipeVelocity: PropTypes.number.isRequired,
  pinchToCloseThreshold: PropTypes.number.isRequired,
  maxZoomScale: PropTypes.number.isRequired,
  onTap: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func.isRequired,
  onPanStart: PropTypes.func.isRequired,
  onPan: PropTypes.func.isRequired,
  onPanEnd: PropTypes.func.isRequired,
  onPinchStart: PropTypes.func.isRequired,
  onPinch: PropTypes.func,
  onPinchEnd: PropTypes.func.isRequired,
  beforeZoomIn: PropTypes.func.isRequired,
  afterZoomIn: PropTypes.func.isRequired,
  onItemLoad: PropTypes.func.isRequired,
  afterReset: PropTypes.func.isRequired,
  beforeZoomOut: PropTypes.func.isRequired,
  afterZoomOut: PropTypes.func.isRequired,
};
