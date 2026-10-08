// Google Analytics 4 event helpers (tag in BaseLayout.astro).
// Never send entered amounts, rates, or other form values, or any personal data:
// event parameters are limited to calculator_name and destination (a domain).

function track(eventName, params) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
}

const used = new Set();

// Once per page view, the first time results appear after the visitor enters or
// submits values (default results shown on page load and shared-link loads don't count).
export function trackCalculatorUsed(calculatorName) {
  if (used.has(calculatorName)) return;
  used.add(calculatorName);
  track('calculator_used', { calculator_name: calculatorName });
}

// The calculators' "Copy link to these results" and "Print" buttons.
export function trackResultButtons(calculatorName) {
  document.getElementById('copy-link-btn')?.addEventListener('click', () => {
    track('result_link_copied', { calculator_name: calculatorName });
  });
  document.getElementById('print-btn')?.addEventListener('click', () => {
    track('result_printed', { calculator_name: calculatorName });
  });
}

// AffiliateCTA links: the destination's domain only, never the full URL.
export function trackLenderLinks() {
  document.querySelectorAll('a[data-lender-link]').forEach((link) => {
    link.addEventListener('click', () => {
      track('lender_link_click', {
        calculator_name: link.dataset.calculatorName,
        destination: new URL(link.href).hostname,
      });
    });
  });
}
