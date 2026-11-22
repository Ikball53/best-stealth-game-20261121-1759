// Keyboard and mouse state for the stage canvas.
window.MapVaultInput = (function () {
  var keys = {};
  var mouse = { x: 480, y: 320, down: false, clicked: false };
  var canvas = null;

  function bind(canvasEl) {
    canvas = canvasEl;
    window.addEventListener('keydown', function (e) {
      keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(e.key.toLowerCase()) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', function () { mouse.down = true; mouse.clicked = true; });
    window.addEventListener('mouseup', function () { mouse.down = false; });
  }

  function pressed(name) { return !!keys[name]; }
  function consumeClick() { var c = mouse.clicked; mouse.clicked = false; return c; }
  function consumeKey(name) { var v = !!keys[name]; if (v) keys[name] = false; return v; }

  return { bind: bind, pressed: pressed, consumeClick: consumeClick, consumeKey: consumeKey, mouse: mouse };
})();
