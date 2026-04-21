const timeoutMap = new Map<
  string,
  { timeoutId: NodeJS.Timeout; counter: number }
>();
export const trackEventEnd = (
  key: string,
  callback: VoidFunction,
  delay: number = 150,
  options?: { counter?: number }
) => {
  const { timeoutId = undefined, counter = options?.counter ?? 0 } =
    timeoutMap.get(key) ?? {};
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // If counter is set and counter is less than or equal to 0, call the callback immediately
  if (options?.counter && options.counter > 0 && 0 >= counter) {
    callback();
    timeoutMap.delete(key);
    return;
  }

  const newTimeoutId = setTimeout(() => {
    callback();
    timeoutMap.delete(key);
  }, delay);

  timeoutMap.set(key, { timeoutId: newTimeoutId, counter: counter - 1 });
};
