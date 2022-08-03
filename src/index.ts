export function exclusivePromiseRunner() {
  let locked: Promise<void> | null = null;

  return async function run<T>(f: () => Promise<T>): Promise<T> {
    while (locked) {
      await locked;
    }
    const promise = f();
    locked = promise
      .catch(() => null)
      .then(() => {
        locked = null;
      });
    return promise;
  };
}
