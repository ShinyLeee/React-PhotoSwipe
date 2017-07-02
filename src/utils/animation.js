import { isFn, isObj } from './index';
import './rAF';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const easing = {
  sineOut: pos => Math.sin(pos * (Math.PI / 2)),
  sineInOut: pos => -(Math.cos(Math.PI * pos) - 1) / 2,
  easeInCubic: pos => pos ** 3,
  easeOutCubic: pos => ((pos - 1) ** 3) + 1,
};

const animations = {};

export const cancelAnimation = (name) => {
  if (animations[name]) {
    if (animations[name].rAF) {
      window.cancelAnimationFrame(animations[name].rAF);
    }
    if (animations[name].done) {
      animations[name].done(); // ensure some func called when animation canceled on the way.
    }
    delete animations[name];
  }
};

export const cancelAllAnimations = () => {
  for (const name in animations) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(animations, name)) {
      cancelAnimation(name);
    }
  }
};

export const registerAnimation = (name, done) => {
  if (animations[name]) {
    cancelAnimation(name);
  }
  if (!animations[name]) {
    animations[name] = { done };
  }
};

export const rAF = (name, fn) => {
  registerAnimation(name);

  if (animations[name]) {
    animations[name].rAF = window.requestAnimationFrame(fn);
  }
};

export const animate = ({ name, start, end, duration, easingType, beforeUpdate, onUpdate, onComplete }) => {
  const done = () => {
    onUpdate(end);
    if (isFn(onComplete)) {
      onComplete();
    }
  };

  registerAnimation(name, done);

  if (animations[name]) {
    let currentTime = 0;

    const isMultiple = isObj(start) && isObj(end);

    const updateLoop = () => {
      currentTime += (1 / 60) * (1000 / duration);

      const p = currentTime;
      const t = easing[easingType](p);

      if (p < 1) {
        animations[name].rAF = window.requestAnimationFrame(updateLoop);
        if (!isMultiple) onUpdate(start + ((end - start) * t));
        else {
          const ret = {};
          for (const prop in start) { // eslint-disable-line no-restricted-syntax
            if (hasOwnProperty.call(start, prop) && hasOwnProperty.call(end, prop)) {
              ret[prop] = start[prop] + ((end[prop] - start[prop]) * t);
            }
          }
          onUpdate(ret);
        }
      } else {
        cancelAnimation(name);
      }
    };
    if (isFn(beforeUpdate)) {
      beforeUpdate();
    }
    updateLoop();
  }
};
