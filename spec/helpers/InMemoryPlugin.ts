import { SyncPlugin } from '../../src/plugin';

export class InMemoryPlugin extends SyncPlugin {
  public messages: any[] = [];
  public process(message: any): any {
    this.messages.push(message);
    return message;
  }
}