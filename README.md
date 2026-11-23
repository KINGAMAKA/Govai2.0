# GOVAI 2.0 – Government AI Services

A mobile-friendly Zambian government-services and business-assistance prototype. V2.0 prioritises natural conversation and three short guided demonstrations.

## New in V2.0

- **Conversation-first opening:** the welcome screen invites users to start talking naturally. The task shortcuts are no longer displayed as the first thing in the chat; users can move into a guided task midway through a conversation.
- **Business name screening demo:** the business-registration journey begins with a proposed name. A sample directory of 50 well-known Zambia-related business and organisation names flags likely matches and asks the user to try another name. This is a demonstration dataset only, not PACRA's register or a live availability check.
- **10-step business registration preparation:** captures a proposed name, activity, structure, applicant, contact details, location and starting capital, then produces a registration preparation summary. PACRA Form 3 has been removed from this demo flow.
- **10-step TPIN preparation:** a shorter information-gathering journey with a preparation summary. It does not issue a TPIN.
- **10-step business profile:** a concise business-development conversation that produces a structured profile and downloadable PDF.
- **Clear demo boundaries:** no name is reserved, no fee is paid and no information is submitted to PACRA or ZRA.

## Existing features retained

- GOVAI chat interface, voice input where supported and spoken read-out.
- Chat history stored locally on the browser/device.
- Editable chat titles.
- Separate government-service pages and Coming Soon screens.
- Business profile PDF generation.

## Important prototype limitations

- GOVAI is an independent prototype, not an official Government of Zambia website and not endorsed by PACRA, ZRA, RTSA or another agency.
- The 50-name screening list is illustrative and may contain names that are not the exact registered legal entity names. It may also omit registered names. A match is a warning to try another name, not a PACRA decision; no match is not proof of availability. Official name clearance must be confirmed through PACRA.
- The business registration flow is a short demo preparation journey, not a complete statutory incorporation application. It does not replace Form 3 or any other prescribed PACRA filing requirement.
- The TPIN flow does not connect to ZRA, issue a TPIN, or submit a tax registration.
- Business profiles and budgets are planning estimates, not guarantees of revenue, profit, funding or business success. Verify costs, licensing and market demand.
- Chat history is stored in the current browser/device using localStorage and does not synchronise between devices.

## Run locally
Open `index.html` in a browser for a basic preview. For service-worker/PWA behaviour, serve the folder over HTTPS or localhost.

## Publish with GitHub Pages
1. Create a GitHub repository named `govai`.
2. Extract this ZIP and upload the contents of this folder (not the outer ZIP folder) to the repository root.
3. Commit to the `main` branch.
4. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
5. The included `deploy.yml` workflow publishes the root website. After the workflow succeeds, open the Pages URL shown in repository Settings → Pages.

## Build an Android APK using GitHub Actions
1. Upload the project to a GitHub repository and push to `main`.
2. Open **Actions** and run **Build GOVAI Android APK**, or push a change to the repository.
3. Wait for the workflow to finish.
4. Open the completed workflow run and download the `GOVAI-debug-APK` artifact.
5. Extract the artifact and install the debug APK on an Android device. Android may ask you to allow installation from that source.

The workflow creates the Capacitor Android project during CI. You do not need to commit generated `android/` or `www/` folders.

## Build Android locally (optional)
Requires Node.js 22, Java 21, Android SDK and Gradle-compatible Android tooling:
```bash
npm install
mkdir -p www
cp index.html style.css app.js manifest.webmanifest sw.js www/
cp -r assets www/
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Project files
- `index.html`, `style.css`, `app.js`: website interface and prototype logic
- `manifest.webmanifest`, `sw.js`: PWA metadata and offline cache
- `.github/workflows/deploy.yml`: GitHub Pages deployment
- `.github/workflows/build-apk.yml`: Android debug APK build
- `capacitor.config.json`, `package.json`: Capacitor configuration

## Production work still required
Before handling real public applications or personal information, add a secure backend, approved agency integrations, authentication and role-based access, data-protection impact assessment, privacy notice, consent flows, audit logs, encryption, backups, monitoring, rate limiting, incident response, accessibility testing and formal agency authorisation. Never put private API keys in browser JavaScript.
