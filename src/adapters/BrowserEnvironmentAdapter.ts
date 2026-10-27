import type { EnvironmentPort } from '../domain/ports';

export class BrowserEnvironmentAdapter implements EnvironmentPort {
  nowIso(): string {
    return new Date().toISOString();
  }
}
