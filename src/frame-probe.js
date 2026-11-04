/*!
 * frame-probe v__VERSION__ | github.com/madewithpixels/frame-probe
 * Finds what makes page animations stutter. Runs only when the address has ?probe.
 */
(function () {
  'use strict';
  var w = window,
    d = document,
    P = w.performance;
  var q = new URLSearchParams(location.search);
  if (!q.has('probe') && !w.frameProbeForce) return;
  if (w.frameProbe && w.frameProbe.version) return; // loaded twice

  // Options: ?probe=10000 records for 10s (default 7s); ?probe-threshold=20 lists frames slower than 20ms (default 24,
  // so one dropped frame at 60Hz shows and ordinary frames don't).
  var DURATION = Math.max(1000, parseInt(q.get('probe'), 10) || 7000);
  var THRESHOLD = Math.max(8, parseInt(q.get('probe-threshold'), 10) || 24);
  var TICK = 5; // ms between busy checks

  var frames = [],
    events = [],
    last = 0,
    worstLate = 0,
    prevTick = P.now(),
    done = false,
    contextFns = [];

  function now() {
    return Math.round(P.now());
  }
  function mark(label) {
    if (!done) events.push([now(), String(label)]);
  }

  // Page code busy: a 5ms timer that runs late means the main thread was blocked for that long. A slow frame with
  // little busy time points at the browser's graphics side (GPU, compositor) instead of the page's own code.
  var busyTimer = setInterval(function () {
    var n = P.now(),
      late = n - prevTick - TICK;
    if (late > worstLate) worstLate = late;
    prevTick = n;
  }, TICK);

  // Optional context column: anything that registers a function returning a short string (frameProbe.context(fn)).
  function context() {
    var out = [];
    for (var i = 0; i < contextFns.length; i++) {
      try {
        var v = contextFns[i]();
        if (v != null && v !== '') out.push(String(v));
      } catch (e) {}
    }
    return out.join(' ');
  }

  // Built-in hooks for things often behind a stutter
  d.addEventListener('DOMContentLoaded', function () {
    mark('DOMContentLoaded');
  });
  w.addEventListener('load', function () {
    mark('page load');
  });
  // GSAP ScrollTrigger: every full re-measure, with how long it took (Webflow interactions use it)
  var hookTimer = setInterval(function () {
    var ST = w.ScrollTrigger;
    if (!ST || typeof ST.refresh !== 'function' || ST.__frameProbe) return;
    ST.__frameProbe = true;
    var refresh = ST.refresh;
    ST.refresh = function () {
      var a = P.now(),
        r = refresh.apply(this, arguments);
      mark('ScrollTrigger.refresh ' + Math.round(P.now() - a) + 'ms');
      return r;
    };
  }, 20);

  function frame(t) {
    if (last) frames.push([Math.round(last), Math.round(t - last), Math.round(worstLate), context()]);
    worstLate = 0;
    last = t;
    if (t < DURATION) requestAnimationFrame(frame);
    else finish();
  }
  requestAnimationFrame(frame);

  function pad(s, n) {
    s = String(s);
    while (s.length < n) s = ' ' + s;
    return s;
  }
  function report() {
    var slow = frames.filter(function (f) {
      return f[1] > THRESHOLD;
    });
    var lines = [];
    lines.push('frame-probe v__VERSION__ · first ' + DURATION + 'ms · frames over ' + THRESHOLD + 'ms');
    lines.push('');
    lines.push('SLOW FRAMES   at ms | frame ms | page code busy ms | context');
    if (!slow.length) lines.push('  none');
    slow.forEach(function (f) {
      lines.push(pad(f[0], 15) + ' | ' + pad(f[1], 8) + ' | ' + pad(f[2], 17) + ' | ' + f[3]);
    });
    lines.push('');
    lines.push('EVENTS        at ms');
    if (!events.length) lines.push('  none');
    events.forEach(function (e) {
      lines.push(pad(e[0], 15) + '   ' + e[1]);
    });
    lines.push('');
    lines.push('Busy close to the frame time = the page’s own code. Busy near 0 = the browser’s graphics side.');
    lines.push(location.href.split('#')[0]);
    lines.push(navigator.userAgent);
    return lines.join('\n');
  }

  function finish() {
    if (done) return;
    done = true;
    clearInterval(busyTimer);
    clearInterval(hookTimer);
    var text = report();
    api.results = { frames: frames, events: events, text: text };
    try {
      console.log(text);
    } catch (e) {}
    show(text);
  }

  function show(text) {
    var box = d.createElement('div');
    box.setAttribute('data-frame-probe', '');
    box.style.cssText =
      'position:fixed;z-index:2147483647;left:10px;bottom:10px;max-width:calc(100vw - 20px);max-height:70vh;overflow:auto;' +
      'background:#000;color:#0f0;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;padding:10px 12px;border-radius:6px;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.5)';
    var bar = d.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:6px';
    function button(label, fn) {
      var b = d.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'font:inherit;color:#0f0;background:#111;border:1px solid #0f0;border-radius:4px;padding:2px 8px;cursor:pointer';
      b.addEventListener('click', fn);
      bar.appendChild(b);
      return b;
    }
    var copy = button('Copy', function () {
      var ok = function () {
          copy.textContent = 'Copied';
        },
        fail = function () {
          copy.textContent = 'Select and copy';
        };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fail);
      else fail();
    });
    button('Close', function () {
      box.remove();
    });
    var pre = d.createElement('pre');
    pre.style.cssText = 'margin:0;white-space:pre;font:inherit;color:inherit';
    pre.textContent = text;
    box.appendChild(bar);
    box.appendChild(pre);
    (d.body || d.documentElement).appendChild(box);
  }

  var api = {
    version: '__VERSION__',
    // Label your own events: frameProbe.mark('menu opened')
    mark: mark,
    // Add a context column: frameProbe.context(function () { return 'slide ' + current; })
    context: function (fn) {
      if (typeof fn === 'function') contextFns.push(fn);
    },
    // Stop early and show the results now
    stop: finish,
    results: null,
  };
  w.frameProbe = api;
})();
