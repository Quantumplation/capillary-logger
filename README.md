# Capillary
![Codeship Badge](https://codeship.com/projects/84ae51b0-fde4-0134-56ba-5274708b3ee2/status?branch=master)
[![npm version](https://badge.fury.io/js/capillary-logger.svg)](https://badge.fury.io/js/capillary-logger)

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
let child = logger.split({ activity: 'Setup' });
// The following message will additionally include the requestId and the activity
child.info({ message: 'Reading data from database', databaseId: '456...' }); 
```

Sometimes, especially in dependency injection scenarios, you don't have all the
context you would like when you split off a child.  Instead, a method is called
later (such as an initialize, configure, or service method) which adds additional
context you'd like to capture in log messages.  Splitting off a separate logger
for this is often inconvenient.

To solve this, we've seen people modifying the context, and to make the intention
of this clearer, we've added a an `augment` method

```javascript
let logger = new Logger({ requestId: '123...' });

...

logger.augment({ currentStep: 'Phase1' });
logger.info({ message: 'Average computed successfully' });
```

When you augment the context, messages logged with any child loggers will include
the updated context

```javascript
let logger = new Logger({ requestId: '123...' });
let averageCalculationLogger = logger.split({ activity: 'Average Calculation' });
...
logger.augment({ currentStep: 'Phase1' });
...
// The following message will include currentStep: Phase1
child.info({ message: 'Average computed successfully' });
...
logger.augment({ currentStep: 'Phase2' });
...
// The following message will include currentStep: Phase2
child.info({ message: 'Average computed successfully' });
...
logger.augment({ currentStep: 'Phase3' });
...
// The following message will include currentStep: Phase3
child.error({ message: 'Failed to compute average', error: ... });
```

### Accepting Capillary Loggers

If you are writing another library, and want to allow (but not require) the use of
a capillary logger, you can check if the logger passed in is capillary compliant via
the the isCapillaryCompatible property on the logger, as so:

```javascript
if(parentLogger && parentLogger.isCapillaryCompatible) {
  this._logger = parentLogger.split({ component: 'my-library' });
} else {
  this._logger = parentLogger;
}
```

## Asynchronicity

Because some plugins may be communicating with outside services, you may want to
respond to failures to log specific messages.  For this, we provide a logAsync
method which returns a promise.

## Plugins

Capillary supports a plugin architecture.  Each message will be passed into
each plugin in the order in which they were activated. This can perform custom 
transformations, filter based on custom logic, or log to custom sources. By
default, the "console" plugin will be active, which logs each message as JSON
to the console.

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

### ConsolePlugin

Writes each log message out to console after passing it through JSON.stringify.

Allows pretty printing, configurable through the following options:

 - prettyPrint
   - (default: `false`)
   - Enables or disables pretty printing altogether
 - seperator
   - (default: `''`)
   - Seperate each log message with some token
 - severityColors
   - (default: `{ trace: 'grey', debug: 'green', info: 'white', warn: 'yellow', error: 'red', fatal: 'bgRed' }`)
   - Specifies the colors to use for each severity level 

### MinimumSeverityPlugin

Filters and discards any messages whose severity is below a pre-defined level.

### TimestampPlugin

Adds the current date and time to each message, using a configurable property name.

### TypePrefixPlugin

Prefixes all top level properties of a message with a prefix based on typeof that property.
This is for use with elastic search and microservices, which has trouble indexing fields
of different types.
