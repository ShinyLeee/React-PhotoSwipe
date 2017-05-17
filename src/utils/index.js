export const delay = function delayFunc(func, timeout = 0, args = []) {
  return setTimeout(() => func.apply(null, [...args]), timeout);
};

export const now = Date.now || function legacy() {
  return new Date().getTime();
};

export const getEmptyPoint = double => (
  !double
  ? { x: null, y: null }
  : { x1: null, y1: null, x2: null, y2: null }
);

export const getScrollY = () => window.pageYOffset || document.documentElement.scrollTop;

export const isClickableElement = element => (element.tagName === 'A' || element.tagName === 'BUTTON');

export const isDomElement = (props, propName, componentName) => {
  if (props[propName] === null || props[propName] === undefined) {
    return null;
  }
  if (!(props[propName] instanceof Element)) {
    return new Error(
      `Invalid prop \`${propName}\` supplied to ${componentName}, expect \`DOM Element\`.`,
    );
  }
  return null;
};
