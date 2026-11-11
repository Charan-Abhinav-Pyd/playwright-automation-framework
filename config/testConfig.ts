import { EnvReader } from '../utils/EnvReader';

export const testConfig = {
  get baseUrl() {
    return EnvReader.requiredUrl('BASE_URL');
  },
} as const;
