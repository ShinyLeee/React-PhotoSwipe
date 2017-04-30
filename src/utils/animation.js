const easing = {
  sineOut: pos => Math.sin(pos * (Math.PI / 2)),
  sineInOut: pos => -(Math.cos(Math.PI * pos) - 1) / 2,
  easeInCubic: pos => pos ** 3,
  easeOutCubic: pos => ((pos - 1) ** 3) + 1,
};

export default function rAF(start, end, duration, easingType, onUpdate, onComplete) {
  let currentTime = 0;

  const isMultiple = typeof start === 'object' && typeof end === 'object';

  function tick() {
    currentTime += (1 / 60) * (1000 / duration);

    const p = currentTime;
    const t = easing[easingType](p);

    if (p < 1) {
      window.requestAnimationFrame(tick);
      if (!isMultiple) onUpdate(start + ((end - start) * t));
      else {
        onUpdate({
          x: start.x !== undefined && start.x + ((end.x - start.x) * t),
          y: start.y !== undefined && start.y + ((end.y - start.y) * t),
          scale: start.scale !== undefined && start.scale + ((end.scale - start.scale) * t),
          opacity: start.opacity !== undefined && start.opacity + ((end.opacity - start.opacity) * t), // eslint-disable-line max-len
        });
      }
    } else if (onComplete === undefined) {
      onUpdate(end);
    } else {
      onUpdate(end);
      onComplete(end);
    }
  }

  tick();
}
