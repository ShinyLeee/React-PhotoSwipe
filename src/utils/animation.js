import './rAF';

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

export const animate = (name, start, end, duration, easingType, onUpdate, onComplete) => {
  const done = () => {
    onUpdate(end);
    if (onComplete !== undefined && typeof onComplete === 'function') {
      onComplete();
    }
  };

  registerAnimation(name, done);

  if (animations[name]) {
    let currentTime = 0;

    const isMultiple = typeof start === 'object' && typeof end === 'object';

    const tick = () => {
      currentTime += (1 / 60) * (1000 / duration);

      const p = currentTime;
      const t = easing[easingType](p);

      if (p < 1) {
        animations[name].rAF = window.requestAnimationFrame(tick);
        if (!isMultiple) onUpdate(start + ((end - start) * t));
        else {
          onUpdate({
            x: start.x !== undefined && start.x + ((end.x - start.x) * t),
            y: start.y !== undefined && start.y + ((end.y - start.y) * t),
            scale: start.scale !== undefined && start.scale + ((end.scale - start.scale) * t),
            opacity: start.opacity !== undefined && start.opacity + ((end.opacity - start.opacity) * t), // eslint-disable-line max-len
          });
        }
      } else {
        cancelAnimation(name);
      }
    };

    tick();
  }
};
