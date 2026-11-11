import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

export default class GoogleChatReporter implements Reporter {
  private readonly webhookUrl = (
    process.env.GOOGLE_CHAT_WEBHOOK_URL ?? process.env.Webhook
  )?.trim();
  private tests: TestCase[] = [];
  private readonly finalStatuses = new Map<string, TestResult['status']>();

  onBegin(_config: FullConfig, suite: Suite): void {
    this.tests = suite.allTests();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.finalStatuses.set(test.id, result.status);
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    const statuses = this.tests.map((test) => this.finalStatuses.get(test.id));
    const passed = statuses.filter((status) => status === 'passed').length;
    const failed = statuses.filter((status) => status === 'failed' || status === 'timedOut').length;
    const skipped = statuses.filter((status) => status === 'skipped').length;
    const notRun = statuses.filter((status) => status === undefined || status === 'interrupted').length;
    const reportUrl = process.env.PLAYWRIGHT_REPORT_URL?.trim();
    const message = [
      `Playwright run ${result.status.toUpperCase()}`,
      `Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped} | Not run: ${notRun}`,
      `Duration: ${(result.duration / 1000).toFixed(1)} seconds`,
      reportUrl ? `Report: ${reportUrl}` : 'HTML report: playwright-report/index.html (available on the runner)',
    ].join('\n');

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ text: message }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        console.error(`Google Chat report delivery failed with HTTP ${response.status}.`);
        return;
      }

      console.log('Google Chat run summary delivered successfully.');
    } catch (error) {
      console.error(
        `Google Chat report delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
