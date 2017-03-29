import { SyncPlugin } from '../../src/plugin';

export class InMemoryPlugin extends SyncPlugin {
  public messages: any[] = [];
  public process(message: any): Promise<any> {
    this.messages.push(message);
    return Promise.resolve(message);
  }
}