// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { STYLES, getSavedStyle, publishStyle } from '../../scripts/style-switcher.js';

function render() {
  const label = document.createElement('label');
  label.className = 'style-switcher';
  label.textContent = 'Page style';

  const select = document.createElement('select');
  STYLES.forEach(({ id, label: text }) => select.append(new Option(text, id)));
  select.value = getSavedStyle();
  select.addEventListener('change', () => publishStyle(select.value));

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Applies to the canvas in Layout mode.';

  label.append(select);
  document.body.append(label, hint);
}

(async function init() {
  render();
  // handshake with Experience Workspace (sets the panel title)
  await DA_SDK;
}());
