import { Severity } from '../logger';
import { SyncPlugin } from '../plugin';

const severityToRank = new Map<Severity, number>([
  ['trace', 0],
  ['debug', 1],
  ['info', 2],
  ['warn', 3],
  ['error', 4],
  ['fatal', 5],
]);

export class MinimumSeverityPlugin extends SyncPlugin {
  private minimumRank: number;
  constructor(minimum: Severity) {
    super();
    this.minimumRank = severityToRank.get(minimum) || 0;
  }

  public process(message: any) {
    if (!message || (!message.severity && this.minimumRank)) {
      return null;
    }
    const rank = severityToRank.get(message.severity) || 0;
    return rank >= this.minimumRank ? message : null;
  }
}
