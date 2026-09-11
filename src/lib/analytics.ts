// Only public configuration belongs here. Never add server credentials.
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';
const siteUrl = 'https://ozgurbayram.github.io/OCPPSimulator/';
const consentKey = 'ocpp-simulator:analytics-consent:v1';
const cookiePrefix = 'ocppsim';
type Consent = 'granted' | 'denied';
type UsageEvent = 'connection_created' | 'simulation_start_requested';
const allowedEvents = new Set<UsageEvent>(['connection_created', 'simulation_start_requested']);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let consent: Consent | null = null;
let initialized = false;
let lastPage: string | undefined;

export function analyticsAvailable() {
  return import.meta.env.PROD && /^G-[A-Z0-9]+$/.test(measurementId) &&
    window.location.origin === 'https://ozgurbayram.github.io' &&
    window.location.pathname.startsWith('/OCPPSimulator/');
}

export function getAnalyticsConsent(): Consent | null {
  try {
    const stored = localStorage.getItem(consentKey);
    consent = stored === 'granted' || stored === 'denied' ? stored : null;
  } catch { /* Keep the choice in memory when storage is unavailable. */ }
  return consent;
}

export function setAnalyticsConsent(value: Consent) {
  consent = value;
  try { localStorage.setItem(consentKey, value); } catch { /* Session-only choice. */ }
  if (value === 'denied') {
    Object.assign(window, { [`ga-disable-${measurementId}`]: true });
    // These cookies belong only to this app, not other GitHub Pages projects.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name.startsWith(`${cookiePrefix}_`)) {
        document.cookie = `${name}=; Max-Age=0; Path=/OCPPSimulator/; Secure; SameSite=Lax`;
      }
    }
    lastPage = undefined;
  } else {
    Object.assign(window, { [`ga-disable-${measurementId}`]: false });
  }
}

function startAnalytics() {
  if (!analyticsAvailable() || getAnalyticsConsent() !== 'granted') return false;
  if (initialized) return true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => { window.dataLayer!.push(args); };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: siteUrl,
    page_referrer: '',
    page_title: 'OCPP Simulator',
    cookie_prefix: cookiePrefix,
    cookie_domain: 'none',
    cookie_path: '/OCPPSimulator/',
    cookie_expires: 60 * 60 * 24 * 180,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  initialized = true;
  return true;
}

export function trackPage(pathname: string) {
  if (!startAnalytics()) return;
  // Never forward route IDs, hashes, queries, referrers or dynamic page titles.
  const page = pathname === '/' ? 'dashboard' : pathname.startsWith('/cp/') ? 'charge-point' : 'other';
  if (lastPage === page) return;
  lastPage = page;
  const fields = {
    page_location: `${siteUrl}#/${page === 'dashboard' ? '' : page}`,
    page_referrer: '',
    page_title: page === 'charge-point' ? 'Charge Point — OCPP Simulator' : 'OCPP Simulator',
  };
  window.gtag?.('set', fields);
  window.gtag?.('event', 'page_view', { ...fields, send_to: measurementId });
}

export function trackUsage(event: UsageEvent) {
  if (!allowedEvents.has(event) || !startAnalytics()) return;
  window.gtag?.('event', event, { send_to: measurementId });
}
