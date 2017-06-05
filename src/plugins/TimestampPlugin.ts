import { SyncPlugin } from '../plugin';

export class TimestampPlugin extends SyncPlugin {
  private propName: string;
  constructor(propName: string = 'timestamp') {
    super();
    this.propName = propName;
  }
  public process(message: any): any {
    message[this.propName] = new Date();
    return message;
  }
}
