import { faker } from '@faker-js/faker';

export type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
};

export function createRegistrationData(): RegistrationData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });

  return {
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      provider: 'example.test',
    }),
    mobile: `${faker.number.int({ min: 1, max: 9 })}${String(
      faker.number.int({ min: 0, max: 999_999_999 }),
    ).padStart(9, '0')}`,
    dateOfBirth: [
      String(birthDate.getDate()).padStart(2, '0'),
      String(birthDate.getMonth() + 1).padStart(2, '0'),
      birthDate.getFullYear(),
    ].join('-'),
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    address: [
      faker.location.streetAddress(),
      `${faker.location.city()}, ${faker.location.state()}`,
      faker.location.country(),
    ].join('\n'),
  };
}

export function chooseRandom<T>(values: readonly T[]): T {
  if (values.length === 0) {
    throw new Error('Cannot choose a random value from an empty list.');
  }

  return faker.helpers.arrayElement(values);
}

export function chooseRandomSubset<T>(values: readonly T[]): T[] {
  if (values.length === 0) {
    throw new Error('Cannot choose a random value from an empty list.');
  }

  const count = faker.number.int({ min: 1, max: values.length });
  return faker.helpers.arrayElements(values, count);
}