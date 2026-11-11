import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { faker } from '@faker-js/faker';
import { expect, test as base, type Page, type TestInfo } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';
import { createRegistrationData } from '../utils/registrationData';

const test = base.extend<{ registrationPage: RegistrationPage }>({
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
});

const executionLogs = new WeakMap<TestInfo, string[]>();

function currentDateData() {
  const data = createRegistrationData();
  const today = new Date();

  return {
    ...data,
    dateOfBirth: [
      String(today.getDate()).padStart(2, '0'),
      String(today.getMonth() + 1).padStart(2, '0'),
      today.getFullYear(),
    ].join('-'),
  };
}

async function createJpeg(page: Page, testInfo: TestInfo): Promise<string> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to generate a JPEG image.');
    }

    context.fillStyle = '#327a64';
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  });
  const filePath = testInfo.outputPath(`profile-${faker.string.uuid()}.jpg`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(base64, 'base64'));
  return filePath;
}

test.beforeEach(async ({ page, registrationPage }, testInfo) => {
  const lines = [`${new Date().toISOString()} START ${testInfo.title}`];
  executionLogs.set(testInfo, lines);
  page.on('console', (message) => lines.push(`${new Date().toISOString()} [console:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => lines.push(`${new Date().toISOString()} [pageerror] ${error.message}`));
  page.on('requestfailed', (request) => lines.push(`${new Date().toISOString()} [requestfailed] ${request.method()} ${request.url()}`));
  await registrationPage.open();
});

test.afterEach(async ({ page }, testInfo) => {
  const lines = executionLogs.get(testInfo) ?? [];
  lines.push(`${new Date().toISOString()} RESULT ${testInfo.status ?? 'unknown'}`);

  const screenshotPath = testInfo.outputPath('full-page.png');
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('full-page-screenshot', { path: screenshotPath, contentType: 'image/png' });
  } catch (error) {
    lines.push(`${new Date().toISOString()} [screenshot-error] ${error instanceof Error ? error.message : String(error)}`);
  }

  const logPath = testInfo.outputPath('execution.log');
  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, lines.join('\n'), 'utf8');
  await testInfo.attach('execution-log', { path: logPath, contentType: 'text/plain' });
});

test('TC_01 full valid form submission with dynamic data (Karnataka to Bengaluru)', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  expect(data.dateOfBirth).toMatch(/^\d{2}-\d{2}-\d{4}$/);

  await registrationPage.fillForm(data, picturePath, { state: 'Karnataka', city: 'Bengaluru' });
  await registrationPage.submit();
  await registrationPage.expectSubmissionAccepted(data, ['Karnataka', 'Bengaluru']);
});

test('TC_02 required field validation when submitted empty', async ({ registrationPage }) => {
  await registrationPage.submit();

  for (const message of [
    'First name is required',
    'Last name is required',
    'A valid email is required',
    'Gender is required',
    'Mobile number must be exactly 10 digits',
    'State is required',
    'City is required',
  ]) {
    await expect(registrationPage.validationErrors).toContainText(message);
  }
});

test('TC_03 rejects short and alphabetic mobile numbers', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(data, picturePath, { state: 'Karnataka', city: 'Bengaluru' });

  for (const invalidMobile of ['123456789', 'mobileabc']) {
    await registrationPage.mobileInput.fill(invalidMobile);
    await registrationPage.submit();
    await expect(registrationPage.validationErrors).toContainText('Mobile number must be exactly 10 digits');
    await registrationPage.clear();
    await registrationPage.fillForm(data, picturePath, { state: 'Karnataka', city: 'Bengaluru' });
  }
});

test('TC_04 Clear resets all inputs and selections', async ({ registrationPage, page }, testInfo) => {
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(currentDateData(), picturePath, { state: 'Karnataka', city: 'Bengaluru' });
  await registrationPage.clear();

  for (const field of [
    registrationPage.firstNameInput,
    registrationPage.lastNameInput,
    registrationPage.emailInput,
    registrationPage.mobileInput,
    registrationPage.dateOfBirthInput,
    registrationPage.pictureInput,
    registrationPage.addressInput,
    registrationPage.stateSelect,
    registrationPage.citySelect,
  ]) {
    await expect(field).toHaveValue('');
  }
  await expect(registrationPage.subjectsSelect.locator('option:checked')).toHaveCount(0);
  await expect.poll(() => registrationPage.genderRadios.evaluateAll((radios) => radios.some((radio) => (radio as HTMLInputElement).checked))).toBe(false);
  await expect.poll(() => registrationPage.hobbyCheckboxes.evaluateAll((boxes) => boxes.some((box) => (box as HTMLInputElement).checked))).toBe(false);
  await expect(registrationPage.citySelect).toBeDisabled();
  await expect(registrationPage.validationErrors).toBeHidden();
});

test('TC_05 rejects malformed email addresses', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(data, picturePath, { state: 'Karnataka', city: 'Bengaluru' });
  await registrationPage.emailInput.fill('not-an-email');
  await registrationPage.submit();

  await expect(registrationPage.validationErrors).toContainText('A valid email is required');
  await expect(page.locator('#result-modal')).toBeHidden();
});

test('TC_06 City options depend on the selected state', async ({ registrationPage }) => {
  await expect(registrationPage.citySelect).toBeDisabled();
  await registrationPage.stateSelect.selectOption({ label: 'Karnataka' });
  await expect(registrationPage.citySelect).toBeEnabled();
  await expect.poll(() => registrationPage.citySelect.locator('option').allTextContents()).toContain('Bengaluru');
  await registrationPage.citySelect.selectOption({ label: 'Bengaluru' });

  await registrationPage.stateSelect.selectOption({ label: 'Kerala' });
  await expect(registrationPage.citySelect).toHaveValue('');
  await expect.poll(() => registrationPage.citySelect.locator('option').allTextContents()).not.toContain('Bengaluru');
});

test('TC_07 selected multiple subjects appear in the submission result', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(data, picturePath, {
    state: 'Karnataka',
    city: 'Bengaluru',
    subjects: ['Selenium', 'Playwright'],
  });
  await registrationPage.submit();

  await expect(page.locator('#result-table')).toContainText('Selenium');
  await expect(page.locator('#result-table')).toContainText('Playwright');
});

test('TC_08 generated data matches required field formats and current date', async ({ registrationPage }) => {
  const data = currentDateData();
  const [day, month, year] = data.dateOfBirth.split('-');
  const expectedDate = `${year}-${month}-${day}`;

  expect(data.firstName).not.toBe('');
  expect(data.lastName).not.toBe('');
  expect(data.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(data.mobile).toMatch(/^\d{10}$/);
  expect(data.dateOfBirth).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  await registrationPage.firstNameInput.fill(data.firstName);
  await registrationPage.lastNameInput.fill(data.lastName);
  await registrationPage.emailInput.fill(data.email);
  await registrationPage.mobileInput.fill(data.mobile);
  await registrationPage.dateOfBirthInput.fill(expectedDate);
  await expect(registrationPage.dateOfBirthInput).toHaveValue(expectedDate);
});

test('TC_09 valid generated JPG uploads successfully', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(data, picturePath, { state: 'Karnataka', city: 'Bengaluru' });
  await expect(registrationPage.pictureInput).toHaveValue(/\.jpg$/i);
  await registrationPage.submit();
  await registrationPage.expectSubmissionAccepted(data);
});

test('TC_10 gender is required before submission', async ({ registrationPage, page }, testInfo) => {
  const data = currentDateData();
  const picturePath = await createJpeg(page, testInfo);
  await registrationPage.fillForm(data, picturePath, {
    state: 'Karnataka',
    city: 'Bengaluru',
    selectGender: false,
  });
  await registrationPage.submit();

  await expect(registrationPage.validationErrors).toContainText('Gender is required');
  await expect(page.locator('#result-modal')).toBeHidden();
});