import { SyncPlugin } from '../../src/plugin';

export class FilterPlugin extends SyncPlugin {
  constructor(private condition: (message: any) => boolean) {
    super();
  }
  public process(message: any) {
    return this.condition(message) ? message : null;
  }
}
