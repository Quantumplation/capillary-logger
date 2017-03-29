# Capillary

Capillary is a logging library with hierarchical context attached to each message.

## Usage

First import the logger for use
```javascript
var capillary = require('capillary');
import { Logger } from 'capillary';
```

From there, you can instantiate and use a logger as one might expect.
The logger exposes helper methods for logging at various severity levels.

```javascript
let logger = new Logger();

logger.info('Attempting to connect to database.');
logger.error('Failed to connect to database.');
```

You can also log structured messages

```javascript
logger.warn({ message: 'Unable to connect to rabbitmq', connectionString: '...', error: err }); 
```

Often, however, there is information you'd like to include with every message,
to provide context.  These are usually things like a request identifier, trace id, 
etc.  It can become quite annoying to 
 - thread this information throughout the code base purely for logging purposes
 - remember to include this information on each and every logger statement

 When instantiating the logger, Capillary lets you specify this context.

```javascript
logger = new Logger({ requestId: '123...' });
logger.info('Processing request...');
```

You can split off child loggers, which inherit their parents context:

```javascript
let logger = new Logger({ requestId: '123...' });
let child = logger.child({ activity: 'Setup' });
// The following message will additionally include the requestId and the activity
child.info({ message: 'Reading data from database', databaseId: '456...' }); 
```

When you update the parent context, messages logged with any child loggers will include
the updated context

```javascript
let logger = new Logger({ requestId: '123...' });
let averageCalculationLogger = logger.child({ activity: 'Average Calculation' });
...
logger.context.currentStep = 'Phase1';
...
// The following message will include currentStep: Phase1
child.info({ message: 'Average computed successfully' });
...
logger.context.currentStep = 'Phase2';
...
// The following message will include currentStep: Phase2
child.info({ message: 'Average computed successfully' });
...
logger.context.currentBlock = 'Phase3';
...
// The following message will include currentStep: Phase3
child.error({ message: 'Failed to compute average', error: ... });
```

## Asynchronicity

Because some plugins may be communicating with outside services, you may want to
respond to failures to log specific messages.  For this, we provide a logAsync
method which returns a promise.

## Plugins

Capillary supports a plugin architecture.  Each message will be passed into
each plugin in the order in which they were activated. This can perform custom 
transformations, or log to custom sources.  By default, the "console" plugin will
be active, which logs each message as JSON to the console.

As soon as the first plugin is registered, however, the default console plugin
will be replaced by the registered plugin.

```javascript
class FileWriterPlugin extends capillary.AsyncPlugin {
  private filename: string;
  constructor(filename: string) {
    this.filename = filename;
  }
  process(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const strMessage = JSON.stringify(message);
      fs.appendFile(this.filename, strMessage, err => {
        return err ? reject(err): resolve();
      });
    });
  }
}

logger.addPlugin(new FileWriterPlugin('logs.txt'));
```

Plugins come in two flavors: Sync and Async.  Capillary makes the guarantee that
any Sync plugins are run synchronously when possible.  That is, if all of your 
plugins are synchronous, the entire thing will be executed synchronously.

### Console Plugin

Writes each log message out to console after passing it through JSON.stringify.

### TimestampPlugin

Adds the current date and time to each message, using a configurable property name.

### TypePrefixPlugin

Prefixes all top level properties of a message with a prefix based on typeof that property.
This is for use with elastic search and microservices, which has trouble indexing fields
of different types.
