/**
 * Shared contract between the style-switcher EW plugin (/tools/style-switcher)
 * and the page rendered in the Experience Workspace canvas (Layout mode).
 *
 * da.live mounts both iframes in shadow DOM, so neither can get a reference to the other.
 * da.live serves both from the same origin ({ref}--{site}--{org}.preview.da.live),
 * so they share a BroadcastChannel and sessionStorage instead.
 */

export const STYLES = [
  { id: 'standard', label: 'Standard' },
  {
    id: 'dark',
    label: 'Dark',
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:ital,wght@0,700;1,700&display=swap',
  },
  {
    id: 'futuristic',
    label: 'Futuristic',
    fonts: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600&family=Orbitron:wght@600;800&display=swap',
  },
];

export const DEFAULT_STYLE = 'standard';

const CHANNEL_NAME = 'da-style-switcher';
const STORAGE_KEY = 'da-style-switcher';
const CLASS_PREFIX = 'style-';

export function isValidStyle(style) {
  return STYLES.some(({ id }) => id === style);
}

export function getSavedStyle() {
  try {
    const style = sessionStorage.getItem(STORAGE_KEY);
    return isValidStyle(style) ? style : DEFAULT_STYLE;
  } catch {
    return DEFAULT_STYLE;
  }
}

// web fonts are only fetched when their style is picked, so the live site is unaffected
function loadStyleFonts(style) {
  const { fonts } = STYLES.find(({ id }) => id === style) || {};
  if (!fonts || document.head.querySelector(`link[href="${fonts}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fonts;
  document.head.append(link);
}

export function applyStyle(style, body = document.body) {
  if (!isValidStyle(style)) return;
  loadStyleFonts(style);
  STYLES.forEach(({ id }) => body.classList.remove(`${CLASS_PREFIX}${id}`));
  body.classList.add(`${CLASS_PREFIX}${style}`);
}

/**
 * Called by the plugin: remember the style and notify the canvas.
 */
export function publishStyle(style) {
  if (!isValidStyle(style)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, style);
  } catch { /* storage unavailable */ }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ style });
  channel.close();
}

/**
 * Only the EW canvas (framed page with the quick-edit param) reacts to the plugin.
 */
export function isCanvas() {
  return window.self !== window.top
    && new URLSearchParams(window.location.search).has('quick-edit');
}

/**
 * Applies the saved style and listens for changes coming from the plugin.
 * Quick-edit only swaps body.innerHTML on re-render, so the class sticks.
 */
export function initCanvasStyleSwitcher() {
  if (!isCanvas() || window.daStyleSwitcherReady) return;
  window.daStyleSwitcherReady = true;

  applyStyle(getSavedStyle());
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener('message', ({ data }) => applyStyle(data?.style));
}
