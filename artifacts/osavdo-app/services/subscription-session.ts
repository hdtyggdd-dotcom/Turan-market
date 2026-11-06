// Serialize all SDK identity changes and operations. A late request from a
// signed-out account may not operate on the next account's SDK session.
export function createSubscriptionQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(isCurrent: () => boolean, work: () => Promise<T>): Promise<T> => {
    const pending = tail.catch(() => undefined).then(async () => {
      if (!isCurrent()) throw new Error("Akkaunt o‘zgardi. Obuna sahifasini qayta oching.");
      return work();
    });
    tail = pending;
    return pending;
  };
}

export function assertSandboxKey(mode: string | undefined, key: string | undefined): asserts key is string {
  if (mode !== "test" || !key?.startsWith("test_")) {
    throw new Error("Sinov do‘koni sozlanmagan. Haqiqiy to‘lovlar yoqilmagan.");
  }
}
