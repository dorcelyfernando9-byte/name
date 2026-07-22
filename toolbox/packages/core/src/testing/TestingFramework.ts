import { logger } from "../logging/Logger";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestGroup {
  name: string;
  tests: TestResult[];
}

export class TestingFramework {
  private groups: TestGroup[] = [];
  private currentGroup?: TestGroup;

  group(name: string, fn: () => void): void {
    this.currentGroup = { name, tests: [] };
    fn();
    this.groups.push(this.currentGroup);
    this.currentGroup = undefined;
  }

  test(name: string, fn: () => void | Promise<void>): void {
    const start = Date.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then(() => {
            this.recordResult(name, true, undefined, Date.now() - start);
          })
          .catch((err) => {
            this.recordResult(name, false, err.message, Date.now() - start);
          });
      } else {
        this.recordResult(name, true, undefined, Date.now() - start);
      }
    } catch (error: any) {
      this.recordResult(name, false, error.message, Date.now() - start);
    }
  }

  private recordResult(name: string, passed: boolean, error?: string, duration?: number): void {
    const result: TestResult = { name, passed, error, duration: duration || 0 };
    if (this.currentGroup) {
      this.currentGroup.tests.push(result);
    } else {
      this.groups.push({ name: "default", tests: [result] });
    }

    if (passed) {
      logger.success(`  ✓ ${name} (${duration}ms)`);
    } else {
      logger.error(`  ✗ ${name} - ${error} (${duration}ms)`);
    }
  }

  async runAll(): Promise<{ total: number; passed: number; failed: number }> {
    logger.info("Running tests...\n");

    for (const group of this.groups) {
      if (group.name !== "default") {
        logger.info(`\n  ${group.name}:`);
      }
      for (const test of group.tests) {
        if (test.passed) {
          logger.success(`  ✓ ${test.name} (${test.duration}ms)`);
        } else {
          logger.error(`  ✗ ${test.name} - ${test.error} (${test.duration}ms)`);
        }
      }
    }

    const total = this.groups.reduce((sum, g) => sum + g.tests.length, 0);
    const passed = this.groups.reduce((sum, g) => sum + g.tests.filter(t => t.passed).length, 0);
    const failed = total - passed;

    logger.info(`\n Results: ${passed}/${total} passed, ${failed} failed`);
    return { total, passed, failed };
  }

  clear(): void {
    this.groups = [];
  }
}

export const testFramework = new TestingFramework();

export function assert(condition: boolean, message?: string): void {
  if (!condition) throw new Error(message || "Assertion failed");
}

export function assertEqual(actual: any, expected: any, message?: string): void {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (!isEqual) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertNotEqual(actual: any, expected: any, message?: string): void {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (isEqual) {
    throw new Error(message || `Expected not equal to ${JSON.stringify(expected)}`);
  }
}
