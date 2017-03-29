import { SyncPlugin } from '../plugin';

export type PrefixMap = { [key: string]: string };
export class TypePrefixPlugin extends SyncPlugin {
  private prefixes: PrefixMap;
  private explicitMappings: PrefixMap;

  constructor(settings?: PrefixMap, explicitMappings?: PrefixMap) {
    super();
    this.prefixes = Object.assign({
      string: 's_',
      number: 'n_',
      object: 'o_',
      date: 'dt_',
    }, settings);
    this.explicitMappings = explicitMappings || {};
  }

  public process(message: any): any {
    let transformedMessage = {};
    for(const key of Object.keys(message)) {
      if(!message.hasOwnProperty(key)) { continue; }
      const value = message[key];
      let type = typeof value;
      let ctor = value.constructor.name.toLowerCase();
      const prefix = this.explicitMappings[key] ||
                     this.prefixes[ctor] ||
                     this.prefixes[type];
      if(prefix !== undefined) {
        transformedMessage[prefix + key] = value;
      } else {
        transformedMessage[key] = value;
      }
    }
    return transformedMessage;
  }
}