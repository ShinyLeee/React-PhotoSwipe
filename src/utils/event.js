export const on = (target, types, listener) => {
  const typeArray = types.split(' ');
  for (let i = 0; i < typeArray.length; i += 1) {
    target.addEventListener(typeArray[i], listener, false);
  }
};

export const off = (target, types, listener) => {
  const typeArray = types.split(' ');
  for (let i = 0; i < typeArray.length; i += 1) {
    target.removeEventListener(typeArray[i], listener, false);
  }
};
