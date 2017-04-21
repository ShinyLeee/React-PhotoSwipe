/**
 * @description return a debounced function which will not triggered as long as
 *              it continues to be invoked. This function will be triggered after
 *              it stop being invoked for `wait` milliseconds.
 *
 * @param {Function}  func - The function wait for debounced
 * @param {Number}    wait - The number of milliseconds to delay
 * @param {Boolean}   leading - Should we trigger function on the leading edge
 *
 * @return {Function} debounced - Return the new debounced function
 */
function debounce(func, wait, leading) {
  var timerId;
  var result;
  var immediate = typeof leading !== 'undefined' ? leading : true; // trigger func immediately by default

  var delayed = function (context, args) {
    timerId = null;
    if (args) {
      result = func.apply(context, args);
    }
  };

  function debounced(args) {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    if (immediate) {
      if (!timerId) { // only trigger when timer has been removed or at first time
        result = func.apply(this, args);
      }
      timerId = setTimeout(delayed, wait);
    } else {
      timerId = setTimeout(function () {
        return delayed(this, args);
      }, wait);
    }
    return result;
  }

  debounced.cancel = function () {
    clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}

module.exports = debounce;
