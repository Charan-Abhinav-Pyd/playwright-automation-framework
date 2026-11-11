import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { chooseRandom, chooseRandomSubset, type RegistrationData } from '../utils/registrationData';

export type RegistrationFormOptions = {
  state?: string;
  city?: string;
  subjects?: string[];
  selectGender?: boolean;
  selectHobbies?: boolean;
};

export class RegistrationPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly mobileInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly subjectsSelect: Locator;
  readonly genderRadios: Locator;
  readonly hobbyCheckboxes: Locator;
  readonly pictureInput: Locator;
  readonly addressInput: Locator;
  readonly stateSelect: Locator;
  readonly citySelect: Locator;
  readonly validationErrors: Locator;
  private readonly submitButton: Locator;
  private readonly clearButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#userEmail');
    this.mobileInput = page.locator('#userNumber');
    this.dateOfBirthInput = page.locator('#dateOfBirth');
    this.subjectsSelect = page.locator('#subjects');
    this.genderRadios = page.getByRole('radio');
    this.hobbyCheckboxes = page.getByRole('checkbox');
    this.pictureInput = page.locator('#uploadPicture');
    this.addressInput = page.locator('#currentAddress');
    this.stateSelect = page.locator('#state');
    this.citySelect = page.locator('#city');
    this.validationErrors = page.locator('#error-list');
    this.submitButton = page.locator('#submit-form');
    this.clearButton = page.locator('#clear-form');
  }

  async open(): Promise<void> {
    const url = process.env.REGISTRATION_URL?.trim();
    if (!url) {
      throw new Error('Set REGISTRATION_URL to the registration form URL.');
    }

    await this.navigateTo(url);
    await expect(this.page.getByRole('heading', { name: 'Practice Form', exact: true })).toBeVisible();
  }

  async fillForm(
    data: RegistrationData,
    picturePath: string,
    options: RegistrationFormOptions = {},
  ): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.mobileInput.fill(data.mobile);
    const [day, month, year] = data.dateOfBirth.split('-');
    await this.dateOfBirthInput.fill(`${year}-${month}-${day}`);

    const subjectOptions = await this.availableOptions(this.subjectsSelect);
    await this.subjectsSelect.selectOption(options.subjects ?? chooseRandomSubset(subjectOptions));

    if (options.selectGender !== false) {
      await this.page.getByRole('radio', { name: data.gender, exact: true }).check();
    }

    if (options.selectHobbies !== false) {
      const availableHobbies = await this.hobbyCheckboxes.evaluateAll((elements) =>
        elements.map((element) => {
          const input = element as HTMLInputElement;
          const label = input.labels?.[0]?.innerText.trim() || input.value;
          return { label, value: input.value };
        }),
      );
      const hobby = chooseRandom(availableHobbies);
      await this.page.getByRole('checkbox', { name: hobby.label, exact: true }).check();
    }

    await this.pictureInput.setInputFiles(picturePath);
    await this.addressInput.fill(data.address);

    const states = await this.availableOptions(this.stateSelect);
    if (options.state) {
      await this.stateSelect.selectOption({ label: options.state });
    } else {
      await this.stateSelect.selectOption(chooseRandom(states));
    }
    await expect.poll(async () => (await this.availableOptions(this.citySelect)).length, {
      message: 'City options did not load for the selected state.',
    }).toBeGreaterThan(0);
    if (options.city) {
      await this.citySelect.selectOption({ label: options.city });
    } else {
      await this.citySelect.selectOption(chooseRandom(await this.availableOptions(this.citySelect)));
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async clear(): Promise<void> {
    await this.clearButton.click();
  }

  async expectSubmissionAccepted(data: RegistrationData, additionalValues: string[] = []): Promise<void> {
    const resultModal = this.page.locator('#result-modal');
    await expect(resultModal, 'The successful-submission result modal was not shown.').toBeVisible();

    const resultTable = this.page.locator('#result-table');
    for (const value of [data.firstName, data.lastName, data.email, data.mobile, ...additionalValues]) {
      await expect(resultTable).toContainText(value);
    }
  }

  private async availableOptions(select: Locator): Promise<string[]> {
    return select.locator('option').evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0),
    );
  }
}