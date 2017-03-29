export abstract class Plugin {
  public abstract isAsync(): this is AsyncPlugin;
  public isSync(): this is SyncPlugin { return !this.isAsync(); }
}

export abstract class AsyncPlugin extends Plugin {
  public isAsync(): this is AsyncPlugin { return true; };
  public abstract process(message: any): Promise<any>;
}

export abstract class SyncPlugin extends Plugin {
  public isAsync(): this is AsyncPlugin { return false; };
  public abstract process(message: any): any;
}