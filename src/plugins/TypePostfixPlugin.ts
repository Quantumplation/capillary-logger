import { SyncPlugin } from '../plugin';

export type PostfixMap = { [key: string]: string };
/**
 * Modifies each message so that field names are postfixed with a type discriminator.
 *
 * The purpose of this plugin is twofold:
 *  - Provide an example of a non-trivial plugin processing on each message
 *  - Enable more effective interop with elasticsearch
 *
 * The second case requires some explanation.
 * Elastic Search internally indexes fields for each object stored in them.  In order
 * to do this, it attempts to infer the type from the first sample of the field it sees.
 * For example, if it sees { payload: 'xyz' }, it might infer that the type is string.
 * However, if another message producer comes along and uses payload as a number or an
 * object, elasticsearch will fail and drop this message entirely.  This is obviously
 * not desirable behavior in the case of logs.  Furthermore, keeping types consistent
 * across distributed teams in a microservices architecture could become an administrative
 * nightmare.
 *
 * To solve this, this plugin looks at the data and postfixes the field names with the
 * type.  This means that elastic search, in the example above, would see
 * { payload_s: 'xyz' } and { payload_n: 10 }, etc., and have no trouble indexing these
 * as the appropriate type.
 *
 * As an aside, the reason that postfix was chosen over prefix is because the tooling
 * around elastic search (such as Kibana) usually sorts fields alphabetically.
 */
export class TypePostfixPlugin extends SyncPlugin {
  private postfixes: PostfixMap;
  private explicitMappings: PostfixMap;

  constructor(settings?: PostfixMap, explicitMappings?: PostfixMap) {
    super();
    this.postfixes = Object.assign({
      string: '_s',
      number: '_n',
      object: '_o',
      date: '_dt',
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
      const postfix = this.explicitMappings[key] ||
                     this.postfixes[ctor] ||
                     this.postfixes[type];
      if(postfix !== undefined) {
        transformedMessage[key + postfix] = value;
      } else {
        transformedMessage[key] = value;
      }
    }
    return transformedMessage;
  }
}