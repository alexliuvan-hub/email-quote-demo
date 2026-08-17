import { calculateQuote } from './calculator.js';

const state = {
  tier: null,
  stories: '1',
  addOns: {
    screens: false,
    interior: false,
    tracks: false,
    pressureWash: false,
  },
};

const estimateEl = document.getElementById('estimateValue');
const breakdownEl = document.getElementById('estimateBreakdown');
const disclaimerEl = document.getElementById('estimateDisclaimer');
const panelEl = document.getElementById('estimatePanel');

function readAddOns() {
  state.addOns.screens = document.getElementById('addonScreens').checked;
  state.addOns.interior = document.getElementById('addonInterior').checked;
  state.addOns.tracks = document.getElementById('addonTracks').checked;
  state.addOns.pressureWash = document.getElementById('addonPressure').checked;
}

function formatBreakdown(quote) {
  if (!quote.tier) {
    return 'Pick how many panes you need cleaned. Exterior washing is included.';
  }
  if (quote.isCustom) {
    return 'Homes with 101+ panes need a custom walkthrough — happy to price that by phone or text.';
  }

  const parts = ['Exterior windows included'];
  if (quote.addOns.interior) parts.push('interior');
  if (quote.addOns.screens) parts.push('screens');
  if (quote.addOns.tracks) parts.push('tracks');
  if (quote.addOns.pressureWash) parts.push('pressure washing');

  const storyLabel =
    state.stories === '3'
      ? '3+ stories noted'
      : state.stories === '2'
        ? '2-story home'
        : '1-story home';

  return `${parts.join(' · ')} · ${storyLabel}`;
}

function refresh() {
  const quote = calculateQuote(state.tier, state.addOns);

  if (quote.total != null) {
    estimateEl.textContent = quote.display;
    estimateEl.dataset.state = 'priced';
  } else if (quote.isCustom) {
    estimateEl.textContent = 'Custom';
    estimateEl.dataset.state = 'custom';
  } else {
    estimateEl.textContent = '—';
    estimateEl.dataset.state = 'empty';
  }

  breakdownEl.textContent = formatBreakdown(quote);
  disclaimerEl.textContent = quote.disclaimer;

  panelEl.classList.remove('is-pulse');
  // Force reflow so the pulse can replay on each change
  void panelEl.offsetWidth;
  panelEl.classList.add('is-pulse');
}

document.querySelectorAll('[data-tier]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.tier = btn.getAttribute('data-tier');
    document.querySelectorAll('[data-tier]').forEach((b) => {
      b.classList.toggle('is-selected', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    refresh();
  });
});

document.querySelectorAll('input[name="stories"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.stories = input.value;
    refresh();
  });
});

['addonScreens', 'addonInterior', 'addonTracks', 'addonPressure'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    readAddOns();
    refresh();
  });
});

refresh();
