import { SyncPlugin } from '../plugin';
import { render } from 'prettyjson';
import chalk from 'chalk';

const defaultSeverityColors = {
  trace: 'grey',
  debug: 'green',
  info: 'white',
  warn: 'yellow',
  error: 'red',
  fatal: 'bgRed',
};

export class ConsolePlugin extends SyncPlugin {
  public constructor(
    private prettyPrint: boolean = false,
    private seperator: string = '',
    private severityColors = defaultSeverityColors,
  ) {
    super();
  }
  public process(message: any): any {
    /* tslint:disable */
    if (this.prettyPrint) {
      // Put severity first, and color code it
      const severityColor = this.severityColors[message.severity];
      const severity: string = chalk[severityColor](message.severity);
      delete message.severity;
      message = Object.assign({ severity }, message);

      // Render it in yaml style for readability
      console.log(
        render(
          message,
          {
            stringColor: null as any,
            keysColor: severityColor,
            dashColor: severityColor,
          },
          2,
        ),
      );
      // Render a separator
      console.log(this.seperator);
    } else {
      console.log(JSON.stringify(message));
    }
    /* tslint:enable */
    return message;
  }
}
