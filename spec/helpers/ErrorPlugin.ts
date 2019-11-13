import { SyncPlugin } from '../../src/plugin';

export class ErrorPlugin extends SyncPlugin {
  constructor(private error: string) {
    super();
  }
  public process(message: any): any {
    throw new Error(this.error);
  }
}
