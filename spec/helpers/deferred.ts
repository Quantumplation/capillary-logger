/**
 * Small defered promise implementation, so we don't rely on Q
 *
 * @class Deferred
 * @template T The type of value the promise will resolve with
 */
export class Deferred<T> {
  public promise: Promise<T>;
  public resolve: (value?: T | PromiseLike<T>) => void;
  public reject: (reason?: any) => void;
  constructor() {
    const self = this;
    this.promise = new Promise<T>((resolve, reject) => {
      self.resolve = resolve;
      self.reject = reject;
    });
  }
}
