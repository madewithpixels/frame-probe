# frame-probe

Find what makes your page animations stutter. Add one inline loader, open the page with `?probe` in the address, and after a few seconds a small box lists every slow frame, whether the page's own code was busy during it, and what else happened at the same moment (page load, scroll re-measures, your own marks).

It needs nothing installed, works on any site (Webflow, WordPress, plain HTML) and in any modern browser, and costs nothing for normal visitors.

## Install (Webflow or any site)

Paste this into the page's **head** custom code (Webflow: Page settings → Custom code → Inside `<head>` tag), or site-wide in Site settings:

```html
<script>
  if (/[?&]probe\b/.test(location.search))
    document.write('<script src="https://cdn.jsdelivr.net/gh/madewithpixels/frame-probe@1.0.1/dist/frame-probe.min.js"><\/script>');
</script>
```

Normal visitors and PageSpeed Insights never download anything: the loader is one line that checks the address and stops. With `?probe`, the probe loads straight away, early enough to catch the page's start-up frames. It uses `document.write` for that reason, and only in probe mode.

Publish the site before testing.

## Use

1. Open the page with `?probe` on the end, for example `https://example.com/?probe` (or `&probe` if there's already a `?`).
2. Keep the window in front and don't touch anything for about 8 seconds.
3. A black box appears bottom-left. Press **Copy** to copy the results as text, or screenshot it. Reload and run it again to see if the pattern repeats.

Options, in the address:

| Option | Meaning | Default |
| --- | --- | --- |
| `?probe=10000` | record for this many ms | 7000 |
| `&probe-threshold=20` | list frames slower than this many ms | 24 (one dropped frame at 60Hz) |

## Reading the results

Each slow frame line: **at ms** (since the page started loading) · **frame ms** (how long the frame took) · **page code busy ms** · **context**.

- **Busy close to the frame time:** the page's own code blocked it, such as scripts, layout or interactions starting up. Look at the events around the same time.
- **Busy near 0:** the main thread was free, so the delay was on the browser's graphics side (GPU, compositing, very large canvases or filters).
- **Context:** whatever your own code reports at that moment (see below), for example which slide or animation step was showing.

Events logged automatically: `DOMContentLoaded`, `page load`, and every GSAP `ScrollTrigger.refresh` with how long it took (Webflow interactions and many other sites use ScrollTrigger).

The results are also printed in the browser console and available as `frameProbe.results` (`frames`, `events`, `text`).

## Add your own markers

```js
if (window.frameProbe) {
  frameProbe.mark('menu opened');                          // an event line
  frameProbe.context(function () { return 'slide ' + i; }); // a context column
}
```

`frameProbe.stop()` ends the recording early and shows the box.

## Limits

- Timers and frames are slowed in background tabs, so keep the window in front.
- Frames before the probe loads aren't seen. With the loader above that's only the first few milliseconds of the page.
- Busy time is measured by a 5ms timer, so it's accurate to about 5ms and can read slightly over the frame time.
- It shows **when** the page was busy, not **which** function. For that, record the same moment in the browser's own profiler (Safari: Develop → Show Web Inspector → Timelines).

## Changing the probe

Using it needs nothing installed. Only if you edit `src/frame-probe.js` do you need to rebuild the file the loader fetches: run `npm install` once, then `npm run build`, which writes `dist/`. `dist/` is committed because jsDelivr serves files straight from the repo.

To release a new version:
1. Bump the version in `package.json` and run `npm run build`.
2. Add a CHANGELOG entry, then commit and push.
3. Publish a GitHub release whose tag is the version number without "v" (for example `1.0.2`).
4. Update the version in your sites' loader.

Never move or re-create a published tag: jsDelivr caches it permanently.
