# Playwright Registration Automation

A TypeScript Playwright framework for end-to-end registration form tests. It uses a Page Object Model, Faker-generated test data, and an optional Google Chat run reporter.

## Setup

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
npx playwright install chromium
```

Set `BASE_URL` and `REGISTRATION_URL` in your local `.env` file or process environment. `BASE_URL` must be a valid HTTP(S) URL; `REGISTRATION_URL` should point to the registration form. Keep `.env` local; it is ignored by Git. Values in `.env` take precedence over inherited process variables for `BASE_URL`.

## Run

```powershell
npm test
npm run test:headed
npm run test:ui
npm run test:debug
npm run typecheck
```

Open the HTML report after a run with `npm run report`.

## Run registration tests

Run the registration suite with:

```powershell
npx playwright test tests/registration.spec.ts --headed --workers=1 --retries=0
```

The registration suite uses Faker-generated data and the form's stable IDs. Each test attaches a full-page screenshot and browser execution log to the HTML report, regardless of pass or fail. The page object expects Subjects, State, and City to be native `<select>` controls; selecting a State should populate City options.

## Google Chat run notifications

Set `GOOGLE_CHAT_WEBHOOK_URL` (or `Webhook`) in the local `.env` file or CI secret store to post a run summary to a Google Chat space after Playwright finishes. Do not commit or paste the webhook URL into source control. The message includes the run status and passed, failed, skipped, and not-run counts. If the HTML report is hosted somewhere your team can access, set `PLAYWRIGHT_REPORT_URL` to include its link; otherwise, the message identifies the report path on the runner. Notification delivery errors are written to the test-run output.

## Structure

```text
config/testConfig.ts       Validated BASE_URL configuration
pages/BasePage.ts          Shared browser navigation behavior
pages/RegistrationPage.ts  Registration form actions and locators
tests/registration.spec.ts Registration validation and submission scenarios
utils/EnvReader.ts         Loads .env and validates required values
utils/registrationData.ts  Faker-backed registration data and selection helpers
playwright.config.ts       Test discovery, browser, reporting, and failure artifacts
reporters/googleChatReporter.ts  Optional Google Chat completion notification
```

The registration tests define their page fixture in the spec. The HTML report, test results, and `node_modules` are generated/local folders and are excluded from Git.