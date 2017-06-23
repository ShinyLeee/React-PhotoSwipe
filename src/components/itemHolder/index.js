/* eslint-disable no-param-reassign */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AnimationBox from './components/animationBox';
import EnhancedWrapper from './styled';
import {
  PAN_FRICTION_LEVEL,
  ZOOM_FRICTION_LEVEL,
  SWIPE_TO_DURATION,
  BOUNCE_BACK_DURATION,
  DIRECTION_VERT,
  DIRECTION_UP,
  DIRECTION_DOWN,
  OUT_TYPE_ZOOM,
  OUT_TYPE_SWIPE_UP,
  OUT_TYPE_SWIPE_DOWN,
} from '../../utils/constant';
import { getEmptyPoint, isDomElement } from '../../utils';
import { animate } from '../../utils/animation';

export default class ItemHolder extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      animating: this.isCurrentSlide,
      loaded: false,
      loadError: false,
    };
    const fitDimension = this.getItemDimension();
    this.longSide = Math.max(fitDimension.width, fitDimension.height);
    this.shortSide = Math.min(fitDimension.width, fitDimension.height);
    this.initItemHolder();
    this.handleTap = this.handleTap.bind(this);
    this.handleDoubleTap = this.handleDoubleTap.bind(this);
    this.handlePanStart = this.handlePanStart.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handlePanEnd = this.handlePanEnd.bind(this);
    this.handlePinchStart = this.handlePinchStart.bind(this);
    this.handlePinch = this.handlePinch.bind(this);
    this.handlePinchEnd = this.handlePinchEnd.bind(this);
    this.handleImageLoad = this.handleImageLoad.bind(this);
  }

  componentDidMount() {
    if (this.props.open && this.isCurrentSlide) {
      this.props.beforeZoomIn(true); // initial zoom in
      this.requestInAnimation(() => this.props.afterZoomIn(true));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.closing !== nextProps.closing) {
      if (nextProps.closing && this.isCurrentSlide) {
        this.props.beforeZoomOut();
        const initCenterPos = this.getAnimWrapperCenterPos();
        const start = {
          x: initCenterPos.x,
          y: initCenterPos.y,
          croppedScale: nextProps.cropped && 1,
          scale: 1,
          opacity: 1,
        };
        const outType = nextProps.sourceElement !== undefined ? OUT_TYPE_ZOOM : OUT_TYPE_SWIPE_DOWN;
        this.setState({ animating: true }, this.requestOutAnimation(start, outType));
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.open !== this.props.open ||
    nextState.animating !== this.state.animating ||
    nextState.loadError !== this.state.loadError ||
    nextProps.itemIndex !== this.props.itemIndex ||
    nextProps.currIndex !== this.props.currIndex ||
    nextProps.horizOffset !== this.props.horizOffset ||
    nextProps.errorBox !== this.props.errorBox;
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
                          ? Math.floor((realItemWidth - viewportSize.width) / 2)
                          : 0;
    const yMovingRange = realItemHeight > viewportSize.height
                          ? Math.floor((realItemHeight - viewportSize.height) / 2)
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
    const { viewportSize } = this.props;
    const dimension = this.getItemDimension(isZoom);
    return {
      x: Math.round((viewportSize.width - (dimension.width * scale)) / 2),
      y: Math.round((viewportSize.height - (dimension.height * scale)) / 2),
    };
  }

  get isCurrentSlide() {
    return this.props.itemIndex === this.props.currIndex;
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

  applyAnimationBoxTransform(x, y, scale) {
    this.animationBox.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
  }

  applyCroppedBoxTransform(s1, s2) {
    this.croppedBox.style.transform = `translateZ(0) scale(${s1})`;
    this.visibleBox.style.transform = `translateZ(0) scale(${s2}`;
  }

  applyImageSize(isZoom) {
    const dimension = this.getItemDimension(isZoom);
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

  initItemHolder() {
    this.resetItemHolder(false, true);
  }

  resetItemHolder(isOut = false, isInit = false) {
    const initCenterPos = this.getAnimWrapperCenterPos();
    this.isZoom = false;
    this.outOfBounds = { x: false, y: false };
    this.boundOffset = undefined; // only use when zoomed
    this.isPanToNext = false;
    this.scaleRatio = undefined;
    this.currScale = 1; // real scale that manipulate item style
    this.currPos = this.getAnimWrapperCenterPos(); // Previous position for zoom gesture
    this.preservedOffset = getEmptyPoint(); // Composed by panning and pinch delta
    this.maxZoomPos = getEmptyPoint(); // Bounce back position if exceed maxZoomScale
    this.maxEventScale = 0;
    this.maxPivotScale = this.covertScale(this.props.maxZoomScale, false);
    if (!isInit) {
      this.applyImageSize(false);
      this.applyAnimationBoxTransform(initCenterPos.x, initCenterPos.y, 1);
    }
    if (isOut) {
      if (this.state.loadError) { // Allow reload item everytime if loadError
        this.setState({ loaded: false, loadError: false });
      }
      this.props.afterZoomOut();
    }
  }

  requestInAnimation(callback) {
    const { currIndex, cropped, sourceElement, showHideDuration } = this.props;
    let start = 0;
    let end = 1;
    if (sourceElement !== undefined) {
      const initCenterPos = this.getAnimWrapperCenterPos();
      const thumbRect = sourceElement.childNodes[currIndex].querySelector('img').getBoundingClientRect();
      const shortRectSide = Math.min(thumbRect.width, thumbRect.height);
      start = {
        x: thumbRect.left,
        y: thumbRect.top,
        scale: shortRectSide / this.shortSide,
        croppedScale: cropped && shortRectSide / this.longSide,
        opacity: 0,
      };
      end = {
        x: initCenterPos.x,
        y: initCenterPos.y,
        croppedScale: cropped && 1,
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
          this.applyAnimationBoxTransform(pos.x, pos.y, pos.scale);
          if (cropped) {
            const ratio = pos.croppedScale / pos.scale;
            const reverseRatio = 1 / ratio;
            this.applyCroppedBoxTransform(ratio, reverseRatio);
          }
        } else {
          this.applyOverlayOpacity(pos);
        }
      },
      () => this.setState({ animating: false }, callback()),
    );
  }

  requestOutAnimation(start, outType) {
    const { currIndex, cropped, sourceElement, showHideDuration } = this.props;
    let end;
    if (outType === OUT_TYPE_ZOOM) {
      const thumbRect = sourceElement.childNodes[currIndex].querySelector('img').getBoundingClientRect();
      const shortRectSide = Math.min(thumbRect.width, thumbRect.height);
      end = {
        x: thumbRect.left,
        y: thumbRect.top,
        croppedScale: cropped && shortRectSide / this.longSide,
        scale: shortRectSide / this.shortSide,
        opacity: 0,
      };
    } else if (outType === OUT_TYPE_SWIPE_UP || outType === OUT_TYPE_SWIPE_DOWN) {
      const fitDimension = this.getItemDimension();
      const initCenterPos = this.getAnimWrapperCenterPos();
      end = {
        x: initCenterPos.x,
        y: outType === OUT_TYPE_SWIPE_UP ? -fitDimension.height : (initCenterPos.y * 2) + fitDimension.height,
        scale: 1,
        opacity: 0,
      };
    }
    if (this.isZoom) {
      this.applyImageSize(false);
    }
    animate(
      'itemHolder__Out',
      start,
      end,
      showHideDuration,
      'easeOutCubic',
      (pos) => {
        this.applyOverlayOpacity(pos.opacity);
        this.applyAnimationBoxTransform(pos.x, pos.y, pos.scale);
        if (cropped) {
          const ratio = pos.croppedScale / pos.scale;
          const reverseRatio = 1 / ratio;
          this.applyCroppedBoxTransform(ratio, reverseRatio);
        }
      },
      () => this.resetItemHolder(true),
    );
  }

  requestZoomAnimation(start, end) {
    if (this.fitRatio > 1) return;
    const bounds = this.getItemBounds(end.scale);
    const offset = this.calculateOffset({ x: end.x, y: end.y }, bounds);

    const nextCenterPos = this.getAnimWrapperCenterPos(end.scale, this.isZoom);

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
      pos => this.applyAnimationBoxTransform(pos.x, pos.y, pos.scale),
      () => {
        if (!this.isZoom) {
          const zoomedScale = this.covertScale(end.scale, true);
          this.applyImageSize(true);
          this.applyAnimationBoxTransform(end.x, end.y, zoomedScale);
          this.currScale = zoomedScale;
        } else {
          this.applyAnimationBoxTransform(end.x, end.y, end.scale);
          this.currScale = end.scale;
        }
        this.isZoom = true;
        this.scaleRatio = undefined;
        this.currPos.x = end.x;
        this.currPos.y = end.y;
        this.maxZoomPos = getEmptyPoint();
      },
    );
  }

  requestPanBackAnimation(currPos) {
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
      pos => this.applyAnimationBoxTransform(pos.x, pos.y, this.currScale),
      () => {
        this.currPos.x = end.x;
        this.currPos.y = end.y;
        this.outOfBounds = { x: false, y: false };
        this.boundOffset = undefined;
      },
    );
  }

  requestResetAnimation(start, resetType) {
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
        this.applyAnimationBoxTransform(pos.x, pos.y, pos.scale);
      },
      () => {
        if (resetType !== 'pan') {
          this.resetItemHolder(false);
        }
        this.props.afterReset(resetType);
      },
    );
  }

  handleTap(e) {
    this.props.onTap(e, this.isZoom);
  }

  handleDoubleTap(e) {
    if (!this.state.loaded || this.state.loadError) return;
    if (this.isZoom) {
      const currScale = Math.min(this.currScale, this.props.maxZoomScale);
      const start = Object.assign({}, this.currPos, { scale: currScale });
      this.requestResetAnimation(start, 'doubleTap');
    } else {
      const maxPivotScale = this.maxPivotScale;
      const initCenterPos = this.getAnimWrapperCenterPos();
      const pinchDelta = this.calculatePinchDelta(e.position, e.position, maxPivotScale);
      this.maxZoomPos = this.calculatePinchPosition(maxPivotScale, pinchDelta);
      this.maxEventScale = maxPivotScale;
      this.preservedOffset.x = pinchDelta.x;
      this.preservedOffset.y = pinchDelta.y;
      const start = Object.assign({}, initCenterPos, { scale: 1 });
      const end = Object.assign({}, this.maxZoomPos, { scale: maxPivotScale });
      this.requestZoomAnimation(start, end);
    }
    this.props.onDoubleTap(e, this.isZoom);
  }

  handlePanStart(e) {
    const bounds = this.getItemBounds(this.currScale);
    const offset = this.calculateOffset(this.currPos, bounds);
    this.boundOffset = offset;
    this.props.onPanStart(e, this.isZoom);
  }

  handlePan(e) {
    const { allowPanToNext, viewportSize } = this.props;
    if (this.isZoom) {
      let currXPos = this.currPos.x + e.delta.accX;
      let currYPos = this.currPos.y + e.delta.accY;
      const bounds = this.getItemBounds(this.currScale);
      const offset = this.calculateOffset({ x: currXPos, y: currYPos }, bounds);
      this.outOfBounds.x = offset.left > 0 || offset.right < 0;
      this.outOfBounds.y = offset.top > 0 || offset.bottom < 0;

      const addFriction = () => {
        if (offset.left > 0) {
          currXPos = Math.round(bounds.x.left + (offset.left * PAN_FRICTION_LEVEL));
        } else if (offset.right < 0) {
          currXPos = Math.round(bounds.x.right + (offset.right * PAN_FRICTION_LEVEL));
        }
        if (offset.top > 0) {
          currYPos = Math.round(bounds.y.top + (offset.top * PAN_FRICTION_LEVEL));
        } else if (offset.bottom < 0) {
          currYPos = Math.round(bounds.y.bottom + (offset.bottom * PAN_FRICTION_LEVEL));
        }
      };

      if (this.outOfBounds.x || this.outOfBounds.y || this.isPanToNext) {
        if (!allowPanToNext) addFriction();
        else if (this.isPanToNext || !this.outOfBounds.y) {
          this.isPanToNext = true;
          if (offset.left > 0) {
            currXPos = bounds.x.left;
            e.delta.accX += this.boundOffset.left;
          } else if (offset.right < 0) {
            currXPos = bounds.x.right;
            e.delta.accX += this.boundOffset.right;
          }
          this.props.onPan(e, this.isZoom);
          return;
        } else if (this.outOfBounds.y) {
          addFriction();
        }
      }
      this.applyAnimationBoxTransform(currXPos, currYPos, this.currScale);
    } else {
      if (e.direction === DIRECTION_VERT) {
        const absAccY = Math.abs(e.delta.accY);
        const opacity = Math.max(1 - (absAccY / viewportSize.height), 0);
        const initCenterPos = this.getAnimWrapperCenterPos();
        this.applyOverlayOpacity(opacity);
        this.applyAnimationBoxTransform(initCenterPos.x, initCenterPos.y + e.delta.accY, 1);
      }
      this.props.onPan(e, this.isZoom);
    }
  }

  // TODO add scrolling animation to zoomed item after swipe
  handlePanEnd(e) {
    const { allowPanToNext } = this.props;
    if (this.isZoom) {
      this.preservedOffset.x += e.delta.accX;
      this.preservedOffset.y += e.delta.accY;
      if (this.outOfBounds.x || this.outOfBounds.y || this.isPanToNext) {
        const currPos = {
          x: this.currPos.x + e.delta.accX,
          y: this.currPos.y + e.delta.accY,
        };
        if (!allowPanToNext) this.requestPanBackAnimation(currPos);
        else if (this.isPanToNext || !this.outOfBounds.y) {
          this.props.onPanEnd(e, this.isZoom, this.outOfBounds);
          setTimeout(this.resetItemHolder(false), SWIPE_TO_DURATION);
          return;
        } else if (this.outOfBounds.y) {
          this.requestPanBackAnimation(currPos);
        }
      } else {
        this.currPos.x += e.delta.accX;
        this.currPos.y += e.delta.accY;
      }
    } else if (e.direction === DIRECTION_UP || e.direction === DIRECTION_DOWN) {
      const { swipeVelocity, sourceElement, viewportSize } = this.props;
      const absVertDelta = Math.abs(e.delta.accY);
      const initCenterPos = this.getAnimWrapperCenterPos();
      const start = {
        x: initCenterPos.x,
        y: initCenterPos.y + e.delta.accY,
        scale: 1,
        croppedScale: 1,
        opacity: Math.max(1 - (absVertDelta / viewportSize.height), 0),
      };
      if (e.velocity > swipeVelocity || (absVertDelta > viewportSize.height * 0.5)) {
        const outType = sourceElement !== undefined // eslint-disable-line no-nested-ternary
                        ? OUT_TYPE_ZOOM
                        : e.direction === DIRECTION_UP ? OUT_TYPE_SWIPE_UP : OUT_TYPE_SWIPE_DOWN;
        this.props.beforeZoomOut();
        this.setState({ animating: true }, this.requestOutAnimation(start, outType));
      } else {
        this.requestResetAnimation(start, 'pan');
      }
    }
    this.props.onPanEnd(e, this.isZoom, this.outOfBounds);
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
      this.applyAnimationBoxTransform(nextPos.x, nextPos.y, realScale);
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
      this.applyAnimationBoxTransform(nextPos.x, nextPos.y, slowScale);
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
        this.setState({ animating: true }, this.requestOutAnimation(start, OUT_TYPE_ZOOM));
      } else if (pivotScale < 1) {
        this.requestResetAnimation(start, 'pinch');
      } else {
        const nextScale = currScale;
        const nextPos = Object.assign({}, currPos);
        this.preservedOffset.x += pinchDelta.x;
        this.preservedOffset.y += pinchDelta.y;
        // const start = Object.assign({}, currPos, { scale: currScale });
        const end = Object.assign({}, nextPos, { scale: nextScale });
        this.requestZoomAnimation(start, end);
      }
    } else {
      const nextScale = this.isZoom ? this.props.maxZoomScale : maxPivotScale;
      const slowScale = this.isZoom ? this.covertScale(currScale, false) : currScale;
      const slowZoomScale = this.maxEventScale + ((e.scale - this.maxEventScale) * ZOOM_FRICTION_LEVEL);
      const pinchDelta = this.calculatePinchDelta(e.initPinchCenter, e.pinchCenter, slowZoomScale);
      const currPos = this.calculatePinchPosition(slowScale, pinchDelta);
      this.preservedOffset.x += pinchDelta.x;
      this.preservedOffset.y += pinchDelta.y;
      const start = Object.assign({}, currPos, { scale: currScale });
      const end = Object.assign({}, this.maxZoomPos, { scale: nextScale });
      this.requestZoomAnimation(start, end);
    }
    this.props.onPinchEnd(e, this.isZoom);
  }

  handleImageLoad(err) {
    setTimeout(() => {
      this.setState({ loaded: true, loadError: err });
      this.props.onItemLoad(this.props.itemIndex);
    }, this.props.showHideDuration);
  }

  render() {
    const { open, item, horizOffset, errorBox } = this.props;
    return (
      <EnhancedWrapper
        shouldBind={open && this.isCurrentSlide}
        style={{ transform: `translate3d(${horizOffset}px, 0px, 0px)` }}
        onTap={this.handleTap}
        onDoubleTap={this.handleDoubleTap}
        onPanStart={this.handlePanStart}
        onPan={this.handlePan}
        onPanEnd={this.handlePanEnd}
        onPinchStart={this.handlePinchStart}
        onPinch={this.handlePinch}
        onPinchEnd={this.handlePinchEnd}
      >
        <AnimationBox
          initPos={this.getAnimWrapperCenterPos()}
          animating={this.state.animating}
          item={item}
          fitDimension={this.getItemDimension()}
          loadError={this.state.loadError}
          errorBox={errorBox}
          rootRef={(el) => { this.animationBox = el; }}
          croppedBoxRef={(el) => { this.croppedBox = el; }}
          visibleBoxRef={(el) => { this.visibleBox = el; }}
          imageRef={(el) => { this.image = el; }}
          onImageLoad={this.handleImageLoad}
        />
      </EnhancedWrapper>
    );
  }
}

ItemHolder.displayName = 'React-Photo-Swipe__ItemHolder';

ItemHolder.defaultProps = {
  closing: false,
};

ItemHolder.propTypes = {
  open: PropTypes.bool.isRequired,
  closing: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired,
  itemIndex: PropTypes.number.isRequired,
  currIndex: PropTypes.number.isRequired,
  horizOffset: PropTypes.number.isRequired,
  viewportSize: PropTypes.object.isRequired,
  cropped: PropTypes.bool.isRequired,
  sourceElement: isDomElement,
  overlay: isDomElement,
  loop: PropTypes.bool.isRequired,
  allowPanToNext: PropTypes.bool.isRequired,
  errorBox: PropTypes.element.isRequired,
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
