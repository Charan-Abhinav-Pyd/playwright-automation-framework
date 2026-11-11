import dotenv from 'dotenv';
import path from 'node:path';

const envFile = dotenv.config({ path: path.resolve(process.cwd(), '.env') }).parsed;

export class EnvReader {
  static required(name: string): string {
    const value = (envFile?.[name] ?? process.env[name])?.trim();

    if (!value) {
      throw new Error(`Missing required environment variable: ${name}. Set it in .env or the process environment.`);
    }

    return value;
  }

  static requiredUrl(name: string): string {
    const value = this.required(name);

    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      throw new Error(`Environment variable ${name} must be a valid HTTP or HTTPS URL.`);
    }

    return value;
  }
}
