(function () {
  'use strict';

  function preventGesture(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
  }

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });

  document.addEventListener('touchmove', function (event) {
    if (event && 'scale' in event && event.scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('dblclick', function (event) {
    preventGesture(event);
  }, { passive: false });
})();
