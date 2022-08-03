import { describe, expect, it } from "vitest";
import { exclusivePromiseRunner } from ".";

describe("exclusive promises", () => {
  it("runs promises in order", async () => {
    const run = exclusivePromiseRunner();
    const first = run(() => resolveAfter(100, "first"));
    const second = run(() => resolveAfter(0, "second"));
    const third = run(() => resolveAfter(50, "third"));
    await expect(Promise.all([first, second, third])).resolves.toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("does not stop because of failing promises", async () => {
    const run = exclusivePromiseRunner();
    const first = run(() => resolveAfter(100, "first"));
    const second = run(() => rejectAfter(0, new Error("second failed")));
    const third = run(() => resolveAfter(50, "third"));
    await expect(Promise.all([first, second, third])).rejects.toEqual(
      new Error("second failed")
    );
    // but it doesn't prevent the third promise from running.
    await expect(third).resolves.toEqual("third");
  });

  it("runs different runners independently", async () => {
    const runA = exclusivePromiseRunner();
    const runB = exclusivePromiseRunner();
    const a1 = runA(() => resolveAfter(100, "A1"));
    const a2 = runA(() => resolveAfter(0, "A2"));
    const a3 = runA(() => resolveAfter(50, "A3"));
    const b1 = runB(() => resolveAfter(50, "B1"));
    const b2 = runB(() => resolveAfter(300, "B2"));
    const promises = [a1, a2, a3, b1, b2];
    const values: string[] = [];
    for (const promise of promises) {
      promise.then((v) => values.push(v));
    }
    await Promise.all(promises);
    expect(values).toEqual(["B1", "A1", "A2", "A3", "B2"]);
  });
});

function resolveAfter<T>(timeout: number, value: T): Promise<T> {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), timeout));
}

function rejectAfter<T>(timeout: number, error: Error): Promise<T> {
  return new Promise<T>((_resolve, reject) =>
    setTimeout(() => reject(error), timeout)
  );
}
