<!-- # Playwright Registration Automation

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

The registration tests define their page fixture in the spec. The HTML report, test results, and `node_modules` are generated/local folders and are excluded from Git. -->


# Playwright Automation Framework

A reusable end-to-end test automation framework built with **Playwright and TypeScript**, following the Page Object Model (POM) design pattern.

The project demonstrates registration form automation, dynamic test data generation, reusable page actions, environment-based configuration, and automated test reporting.

## Tech Stack

- Playwright
- TypeScript
- Node.js and npm
- Page Object Model (POM)
- Faker.js
- Google Chat Webhook Integration

## Key Features

- **Page Object Model:** Separates page locators and actions from test scenarios.
- **Reusable Components:** Shared browser navigation and page-level functionality.
- **Dynamic Test Data:** Generates registration data using Faker.
- **Environment Configuration:** Reads application URLs from environment variables.
- **Execution Evidence:** Attaches full-page screenshots and browser logs to the HTML report.
- **Google Chat Notifications:** Sends test execution summaries to a configured Google Chat space.
- **Multiple Execution Modes:** Supports headed, UI, debug, and standard test execution.

## Project Structure

```text
playwright-automation-framework/
│
├── .github/
│   └── agents/
│
├── config/
│   └── testConfig.ts
│
├── pages/
│   ├── BasePage.ts
│   └── RegistrationPage.ts
│
├── reporters/
│   └── googleChatReporter.ts
│
├── tests/
│   └── registration.spec.ts
│
├── utils/
│   ├── EnvReader.ts
│   └── registrationData.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm

## Installation

Clone the repository:

```bash
git clone https://github.com/Charan-Abhinav-Pyd/playwright-automation-framework.git
cd playwright-automation-framework
```

Install dependencies:

```bash
npm install
```

Install Chromium:

```bash
npx playwright install chromium
```

## Environment Configuration

Configure the following environment variables:

```env
BASE_URL=your_application_base_url
REGISTRATION_URL=your_registration_page_url
GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook
```

Keep actual credentials and webhook URLs in your local environment. Never commit them to GitHub.

## Test Execution

Run all tests:

```bash
npm test
```

Run tests in headed mode:

```bash
npm run test:headed
```

Run using Playwright UI mode:

```bash
npm run test:ui
```

Run in debug mode:

```bash
npm run test:debug
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Run the registration suite specifically:

```bash
npx playwright test tests/registration.spec.ts --headed --workers=1 --retries=0
```

## Test Reports

After test execution, open the HTML report:

```bash
npm run report
```

The registration tests attach full-page screenshots and browser execution logs to the report for both successful and failed executions.

## Google Chat Integration

The framework supports optional Google Chat notifications after test execution.

Configure `GOOGLE_CHAT_WEBHOOK_URL` using a secure environment variable or CI secret.

The notification provides:
- Overall execution status
- Passed test count
- Failed test count
- Skipped test count
- Not-run test count
- Report location or configured report URL

## Framework Design

The framework follows a modular design:

- **Configuration Layer:** Manages application URLs and environment settings.
- **Page Layer:** Contains reusable page objects and browser actions.
- **Test Layer:** Contains registration scenarios and assertions.
- **Utility Layer:** Handles environment reading and test data generation.
- **Reporting Layer:** Produces execution evidence and Google Chat notifications.

## Repository

GitHub: https://github.com/Charan-Abhinav-Pyd/playwright-automation-framework
