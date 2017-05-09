import React, { Component, PropTypes } from 'react';
import { delay, now, getEmptyPoint } from '../../utils/index';

/**
 * @description React HOC that handle touch event and produce
 *              `tap`, `doubleTap`, `pan`, `swipe`, `pinch` and `zoom` for React-Photo-Swipe
 *              Inspired by AlloyFinger https://github.com/AlloyTeam/AlloyFinger
 *
 * @param {Function} ListenedComponent - The component want to listen below events
 * @param {Object}   options - Some useful options
 */

const defaultOps = {
  // The maximum position difference between multiple taps,
  // exceeding will trigger `pan` event instead of `tap` event.
  maxTapOffset: 10,

  // The maximum time in ms between multiple taps,
  // within this range doing multiple tap will trigger `doubleTap` instead of `tap`
  maxTapInterval: 275,

  // Minimal pan distance required before recognizing direction.
  minPanDistance: 10,
};

export default function withGesture(ListenedComponent, options = defaultOps) {
  class Gesture extends Component {
    constructor(props) {
      super(props);
      this.doubleTap = false;
      this.tapTimerId = undefined;
      this.swipeTimerId = undefined;
      this.initPinchLen = undefined;
      this.lastTime = null;
      this.currTime = null;
      this.tapPos = getEmptyPoint();
      this.startPanPos = getEmptyPoint();
      this.lastPanPos = getEmptyPoint();
      this.panAccDelta = getEmptyPoint();
      this.panDirection = undefined;
      this.initPinchCenter = getEmptyPoint();
      this.pinchCenter = getEmptyPoint();
      this.currPos = getEmptyPoint(true);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchMove = this.handleTouchMove.bind(this);
      this.handleTouchCancel = this.handleTouchCancel.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    getSwipeDirection() {
      let direction;
      const finX = this.lastPanPos.x;
      const finY = this.lastPanPos.y;
      const satX = this.startPanPos.x;
      const satY = this.startPanPos.y;
      if (this.panDirection === 'lr') {
        direction = finX - satX > 0 ? 'Right' : 'Left';
      } else if (this.panDirection === 'ud') {
        direction = finY - satY > 0 ? 'Down' : 'Up';
      }
      return direction;
    }

    getPinchLen() {
      const hLen = this.currPos.x2 - this.currPos.x1;
      const vLen = this.currPos.y2 - this.currPos.y1;
      return Math.sqrt((hLen * hLen) + (vLen * vLen));
    }

    getMiddlePoint(p) { // eslint-disable-line class-methods-use-this
      return {
        x: Math.round((p.x1 + p.x2) * 0.5),
        y: Math.round((p.y1 + p.y2) * 0.5),
      };
    }

    checkIsTap() {
      const { maxTapOffset } = options;
      return Math.abs(this.currPos.x1 - this.tapPos.x) < maxTapOffset && Math.abs(this.currPos.y1 - this.tapPos.y) < maxTapOffset; // eslint-disable-line max-len
    }

    checkIsdoubleTap() {
      if (!this.lastTime) return false;
      const { maxTapInterval } = options;
      const interval = this.currTime - this.lastTime;
      if (interval > 0 && interval < maxTapInterval && this.checkIsTap()) {
        return true;
      }
      return false;
    }

    emit(type, e) {
      if (this.props[type]) {
        this.props[type](e);
      }
      // console.log(type);
    }

    handleTouchStart(e) {
      e.persist();
      e.preventDefault();
      const evt = { originalEvent: e };
      const fingerNum = e.touches.length;
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      this.currTime = now();
      this.currPos.x1 = clientX;
      this.currPos.y1 = clientY;

      if (fingerNum > 1) {
        this.currPos.x2 = e.touches[1].clientX;
        this.currPos.y2 = e.touches[1].clientY;
        this.initPinchLen = this.getPinchLen();
        this.initPinchCenter = this.getMiddlePoint(this.currPos);
        evt.initPinchCenter = this.initPinchCenter;
        evt.pinchCenter = this.initPinchCenter;
        evt.position = this.currPos;
        evt.scale = 1;
        this.emit('onPinchStart', evt);
      } else {
        if (this.tapPos.x !== null && this.tapPos.y !== null && this.checkIsdoubleTap()) {
          clearTimeout(this.tapTimerId);
          this.doubleTap = true;
        }
        this.lastTime = now();
        this.tapPos.x = clientX;
        this.tapPos.y = clientY;
      }
    }

    handleTouchMove(e) {
      e.persist();
      // Avoid vertical touchmove scroll page and pinch zoom page.
      e.preventDefault();
      const evt = { originalEvent: e };
      const fingerNum = e.touches.length;
      this.currPos.x1 = e.touches[0].clientX;
      this.currPos.y1 = e.touches[0].clientY;
      if (fingerNum > 1) {
        this.currPos.x2 = e.touches[1].clientX;
        this.currPos.y2 = e.touches[1].clientY;
        this.pinchCenter = this.getMiddlePoint(this.currPos);
        evt.initPinchCenter = this.initPinchCenter;
        evt.pinchCenter = this.pinchCenter;
        evt.position = this.currPos;
        evt.scale = this.getPinchLen() / this.initPinchLen;
        this.emit('onPinch', evt);
      } else {
        const lastPanPos = this.lastPanPos;
        const panAccDelta = this.panAccDelta;
        this.startPanPos = { x: this.tapPos.x, y: this.tapPos.y };
        if (lastPanPos.x !== null && lastPanPos.y !== null) {
          const { minPanDistance } = options;
          const absPanAccDeltaX = Math.abs(panAccDelta.x);
          const absPanAccDeltaY = Math.abs(panAccDelta.y);
          evt.delta = {
            x: this.currPos.x1 - lastPanPos.x,
            y: this.currPos.y1 - lastPanPos.y,
            accX: panAccDelta.x,
            accY: panAccDelta.y,
          };
          if (this.panDirection !== undefined) {
            evt.direction = this.panDirection;
            this.emit('onPan', evt);
          } else if (absPanAccDeltaX >= minPanDistance || absPanAccDeltaY >= minPanDistance) {
            this.panDirection = absPanAccDeltaX > absPanAccDeltaY ? 'lr' : 'ud';
            evt.direction = this.panDirection;
            this.emit('onPanStart', evt);
          }
        } else {
          evt.delta = { x: 0, y: 0 };
        }
        this.lastPanPos.x = this.currPos.x1;
        this.lastPanPos.y = this.currPos.y1;
        this.panAccDelta.x += evt.delta.x;
        this.panAccDelta.y += evt.delta.y;
      }
    }

    handleTouchCancel() {
      clearTimeout(this.tapTimerId);
      clearTimeout(this.swipeTimerId);
    }

    handleTouchEnd(e) {
      e.persist();
      // console.log('touchend');
      const evt = { originalEvent: e };
      if (this.currPos.x2 !== null && this.currPos.y2 !== null) {
        evt.initPinchCenter = this.initPinchCenter;
        evt.pinchCenter = this.pinchCenter;
        evt.position = this.currPos;
        evt.scale = this.getPinchLen() / this.initPinchLen;
        this.emit('onPinchEnd', evt);
        this.initPinchLen = undefined;
        this.initPinchCenter = getEmptyPoint();
        this.pinchCenter = getEmptyPoint();
        // console.log('pinch end event', this.currPos.x2);
      } else if (this.checkIsTap()) {
        evt.position = { x: this.tapPos.x, y: this.tapPos.y };
        const emitTapEvent = () => {
          this.emit('onTap', evt);
        };
        // console.log('delay tap', this.currPos.x2);
        this.tapTimerId = delay(emitTapEvent, options.maxTapInterval);
        if (this.doubleTap) {
          this.emit('onDoubleTap', evt);
          clearTimeout(this.tapTimerId);
          this.tapPos = getEmptyPoint();
          this.doubleTap = false;
        }
      } else if (this.lastPanPos.x !== null && this.lastPanPos.y !== null) {
        evt.direction = this.getSwipeDirection();
        evt.delta = { accX: this.panAccDelta.x, accY: this.panAccDelta.y };
        this.emit('onPanEnd', evt);
        this.emit('onSwipe', evt);
      }
      this.startPanPos = getEmptyPoint();
      this.lastPanPos = getEmptyPoint();
      this.panAccDelta = getEmptyPoint();
      this.panDirection = undefined;
      this.currPos.x2 = null;
      this.currPos.y2 = null;
    }

    render() {
      return (
        <ListenedComponent
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
          onTouchCancel={this.handleTouchCancel}
          onTouchEnd={this.handleTouchEnd}
          {...this.props}
        />
      );
    }
  }

  Gesture.displayName = 'React-Photo-Swipe__Gesture';

  Gesture.propTypes = {
    onTap: PropTypes.func,
    onDoubleTap: PropTypes.func,
    onPanStart: PropTypes.func,
    onPan: PropTypes.func,
    onPanEnd: PropTypes.func,
    onSwipe: PropTypes.func,
    onPinchStart: PropTypes.func,
    onPinch: PropTypes.func,
    onPinchEnd: PropTypes.func,
  };

  return Gesture;
}
