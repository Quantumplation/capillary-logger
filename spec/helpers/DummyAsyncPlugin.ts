import { AsyncPlugin } from '../../src/plugin';
import { Deferred } from './deferred';

export type PendingMessage = { deferred: Deferred<any>; message: any };

export class DummyAsyncPlugin extends AsyncPlugin {
  public awaitingMessages: PendingMessage[] = [];
  public process(message: any): Promise<any> {
    let deferred = new Deferred<any>();
    this.awaitingMessages.push({ deferred, message });
    return deferred.promise;
  }
}
