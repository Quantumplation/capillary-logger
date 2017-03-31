export abstract class Plugin {
}

export abstract class AsyncPlugin extends Plugin {
  public abstract process(message: any): Promise<any>;
}

export abstract class SyncPlugin extends Plugin {
  public abstract process(message: any): any;
}