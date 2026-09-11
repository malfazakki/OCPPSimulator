# Optional Google Analytics 4

No Firebase backend or private API key is required. The public `G-...` measurement ID is visible in the browser even when supplied by GitHub Actions. Never supply a service account, Measurement Protocol API secret or other private credential to Vite.

## Enable on the official site

1. Create a Google Analytics property and a **Web** data stream for `https://ozgurbayram.github.io/OCPPSimulator/`.
2. **Turn off Enhanced measurement for that stream before deployment.** This prevents Google's automatic history, form, outbound-link and other collection from bypassing the app's manually sanitized events. Do not enable Google Signals, user-provided data collection or advertising integrations for this setup.
3. Copy the stream's `G-...` measurement ID.
4. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**. Add `VITE_GA_MEASUREMENT_ID` with that value. It is a public identifier, so a repository variable is sufficient.
5. Run **Actions → Deploy to GitHub Pages → Run workflow**, or push the integration to main. Changing a variable alone does not rebuild the site.
6. On the live site, allow analytics and check GA4 Realtime. Rejecting analytics sends no tag request or events. Ad blockers can prevent collection.

Without the variable, the app does not load Google Analytics or show analytics controls. Localhost, alternate hosts and forks' normal deployments are disabled. The host/path check avoids accidental reporting; it cannot prevent someone deliberately sending forged events to a public ID.

## Collection and consent

- Nothing is sent to Google Analytics before an affirmative choice. Rejected events are discarded, never replayed.
- `page_view`: dashboard, generic charge-point page, or other. Moving between individual charge points does not generate distinct page views.
- `connection_created`: a charge point was added locally, not confirmation of a successful connection.
- `simulation_start_requested`: StartTx was requested, not confirmation of a successful charging transaction.
- No custom event payloads: no connection names, CP IDs, CSMS URLs, RFID tags, credentials or protocol frames. Page URLs and titles are fixed categories; referrers are blank. Google still receives normal browser/network metadata and uses pseudonymous analytics cookies after consent.
- Consent is saved locally under `ocpp-simulator:analytics-consent:v1`. Analytics cookies use the app-specific `ocppsim` prefix, host-only domain and `/OCPPSimulator/` path, with a configured 180-day lifetime.
- **Analytics preferences** lets users change their choice. Withdrawal disables collection, removes this app's analytics cookies and reloads to unload Google's listeners. Previously collected data is not deleted by withdrawal.
- The previous Vercel Analytics component is no longer mounted.

## Verify before enabling

Use browser Network tools with cleared consent: no `googletagmanager.com` or Analytics collection request before acceptance or after rejection. Accept: one tag script, one page view; open a charge point: only a generic charge-point URL. Trigger Create/StartTx and inspect the corresponding event names with no user-entered data. Withdraw: app reloads, prefixed cookies disappear, no further analytics requests. Repeat with a narrow mobile viewport and keyboard controls.

Remove the repository variable and redeploy to disable analytics globally. Restoring a prior release also rolls back the integration.
