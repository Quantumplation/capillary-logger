import { Plugin, SyncPlugin, AsyncPlugin } from './plugin';
import { ConsolePlugin } from './plugins/ConsolePlugin';

export type Severity = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export class Logger {
  public readonly isCapillaryCompatible: boolean = true;
  public context: any | undefined;
  private parent: Logger | undefined;
  private customPlugins: boolean;
  private plugins: Plugin[];

  constructor(context?: any, parent?: Logger) {
    this.context = context;
    this.parent = parent;
    this.customPlugins = false;
    if (parent === undefined) {
      this.plugins = [new ConsolePlugin()];
    }
  }

  public static orDefault(logger: Logger | null | undefined): Logger {
    return logger || new NullLogger();
  }

  public addPlugin(plugin: Plugin) {
    if (this.parent) {
      // Couldn't think of clean semantics for this, so we just disallow it for now
      throw new Error('Unable to add plugins on child loggers.');
    }
    if (!this.customPlugins) {
      this.customPlugins = true;
      this.plugins = [];
    }
    this.plugins.push(plugin);

    return this;
  }

  public split(context?: any) {
    return new Logger(context, this);
  }

  public augment(additionalContext?: any) {
    Object.assign(this.context, additionalContext);
  }

  public log(severity: Severity, message: string | any) {
    // Note we intentionally leave this promise dangling, since our consumers don't
    // expect this to be async. If we encounter an error, we have a fail-safe
    // console.log so that errors in loggers/plugins aren't impossible to debug.
    this.logAsync(severity, message).catch(error => {
      const wrappedError = {
        severity: 'error',
        message:
          'An error occurred while processing log messages from capillary',
        error,
      };
      /* tslint:disable */
      console.log(JSON.stringify(wrappedError));
      /* tslint:enable */
    });
  }

  public async logAsync(
    severity: Severity,
    message: string | any,
  ): Promise<void> {
    // NOTE!! We are heavily dependent on the following behavior:
    // an async function is run immediately (synchronously) until the first await,
    // and *then* the rest of the function is placed on the event queue.  This is
    // in contrast to the entire function being placed on the event queue.
    message = typeof message === 'object' ? message : { message };
    let fullMessage = this.getFullMessage(severity, message);
    const plugins = this.getPluginList();
    for (const plugin of plugins) {
      if (fullMessage === null || fullMessage === undefined) {
        return;
      }
      if (plugin instanceof SyncPlugin) {
        fullMessage = plugin.process(fullMessage);
      } else if (plugin instanceof AsyncPlugin) {
        fullMessage = await plugin.process(fullMessage);
      }
    }
  }

  public trace(message: string | any) {
    this.log('trace', message);
  }
  public debug(message: string | any) {
    this.log('debug', message);
  }
  public info(message: string | any) {
    this.log('info', message);
  }
  public warn(message: string | any) {
    this.log('warn', message);
  }
  public error(message: string | any) {
    this.log('error', message);
  }
  public fatal(message: string | any) {
    this.log('fatal', message);
  }

  private getPluginList(): Plugin[] {
    let current: Logger | undefined = this;
    while (current.parent !== undefined) {
      current = current.parent;
    }
    return current.plugins;
  }

  private getFullMessage(severity: Severity, message: any): any {
    let contexts = [this.context];
    let current = this.parent;
    while (current !== undefined) {
      contexts.push(current.context);
      current = current.parent;
    }
    contexts.reverse();
    // Coalesce each parent context, the message, and set the severity property
    return Object.assign.apply(null, [{}, ...contexts, message, { severity }]);
  }
}

export class NullLogger extends Logger {
  public addPlugin(plugin: Plugin) {
    return this;
  }
  public async logAsync(
    severity: Severity,
    message: string | any,
  ): Promise<void> {
    return;
  }
  public split(context?: any): Logger {
    return this;
  }
}
