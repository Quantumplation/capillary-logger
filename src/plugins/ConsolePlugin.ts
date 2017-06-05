import { SyncPlugin } from '../plugin';

export class ConsolePlugin extends SyncPlugin {
  public process(message: any): any {
    /* tslint:disable */
    console.log(JSON.stringify(message));
    /* tslint:enable */
    return message;
  }
}
