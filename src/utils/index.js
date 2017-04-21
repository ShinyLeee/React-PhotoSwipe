export const delay = function delayFunc(func, timeout = 0, args = []) {
  return setTimeout(() => func.apply(null, [...args]), timeout);
};

export const now = Date.now || function legacy() {
  return new Date().getTime();
};

export const getEmptyPoint = () => ({ x: null, y: null });

export const on = (target, types, listener) => {
  const typeArray = types.split(' ');
  for (let i = 0; i < types.length; i += 1) {
    target.addEventListener(typeArray[i], listener, false);
  }
};

export const off = (target, types, listener) => {
  const typeArray = types.split(' ');
  for (let i = 0; i < types.length; i += 1) {
    target.removeEventListener(typeArray[i], listener, false);
  }
};
