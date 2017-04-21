const easing = {
  sineOut: pos => Math.sin(pos * (Math.PI / 2)),
  sineInOut: pos => -(Math.cos(Math.PI * pos) - 1) / 2,
  easeOutCubic: pos => ((pos - 1) ** 3) + 1,
};

export default function startAnimation(start, end, duration, easingType, onUpdate, onComplete) {
  // console.log(start, end);
  let currentTime = 0;

  const isMultiple = typeof start === 'object';

  function tick() {
    currentTime += (1 / 60) * (1000 / duration);

    const p = currentTime;
    const t = easing[easingType](p);

    if (p < 1) {
      window.requestAnimationFrame(tick);
      if (!isMultiple) onUpdate(start + ((end - start) * t));
      else {
        onUpdate({
          x: start.x && start.x + ((end.x - start.x) * t),
          y: start.y && start.y + ((end.y - start.y) * t),
          scale: start.scale && start.scale + ((end.scale - start.scale) * t),
        });
      }
    } else if (onComplete === undefined) {
      onUpdate(end);
    } else {
      onComplete(end);
    }
  }

  tick();
}
