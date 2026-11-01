import type { EnvironmentPort } from '../domain/ports';

export class BrowserEnvironmentAdapter implements EnvironmentPort {
  nowIso(): string {
    return new Date().toISOString();
  }

  nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
