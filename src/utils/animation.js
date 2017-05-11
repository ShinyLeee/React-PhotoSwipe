import './rAF';

const easing = {
  sineOut: pos => Math.sin(pos * (Math.PI / 2)),
  sineInOut: pos => -(Math.cos(Math.PI * pos) - 1) / 2,
  easeInCubic: pos => pos ** 3,
  easeOutCubic: pos => ((pos - 1) ** 3) + 1,
};

const animationEngine = {

  animations: {},

  registerAnimation(name) {
    if (this.animations[name]) {
      this.cancelAnimation(name);
    }
    if (!this.animations[name]) {
      this.animations[name] = {};
    }
  },

  cancelAnimation(name) {
    if (this.animations[name]) {
      if (this.animations[name].raf) {
        window.cancelAnimationFrame(this.animations[name].raf);
      }
      delete this.animations[name];
    }
  },

  cancelAnimationFrame() {
    const animations = this.animtions;
    for (const name in animations) { // eslint-disable-line no-restricted-syntax
      if (Object.prototype.hasOwnProperty.call(animations, name)) {
        this.cancelAnimation(name);
      }
    }
  },

  rAF(name, start, end, duration, easingType, onUpdate, onComplete) {
    this.registerAnimation(name);

    if (this.animations[name]) {
      let currentTime = 0;

      const isMultiple = typeof start === 'object' && typeof end === 'object';

      const tick = () => {
        currentTime += (1 / 60) * (1000 / duration);

        const p = currentTime;
        const t = easing[easingType](p);

        if (p < 1) {
          this.animations[name].rAF = window.requestAnimationFrame(tick);
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
          this.cancelAnimation(name);
          onUpdate(end);
          if (onComplete !== undefined && typeof onComplete === 'function') {
            onComplete();
          }
        }
      };

      tick();
    }
  },
};

export default animationEngine;
