import { SyncPlugin } from '../../src/plugin';

export class AddPropertyPlugin extends SyncPlugin {
  private property: string;
  private value: any;
  constructor(prop: string, value: any) {
    super();
    this.property = prop;
    this.value = value;
  }
  public process(message: any): any {
    message[this.property] = this.value;
    return message;
  }
}