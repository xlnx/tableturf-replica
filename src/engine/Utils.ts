export function requestTimeout<T>(params: {
  request: Promise<T>;
  timeoutSec: number;
  message: string;
}): Promise<T> {
  const { request, timeoutSec, message } = params;
  return Promise.race([
    request,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(message), timeoutSec * 1000);
    }),
  ]);
}
