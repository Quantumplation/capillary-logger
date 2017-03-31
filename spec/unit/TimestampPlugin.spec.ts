import { expect } from 'chai';

import { TimestampPlugin } from '../../src/plugins/TimestampPlugin';

describe('Timestamp plugin', async () => {
  it('should add current timestamp to messages', async () => {
    const plugin = new TimestampPlugin();
    const output = plugin.process({ message: 'some message' });
    expect(output).to.have.property('timestamp');
    expect(output.timestamp).to.be.a('Date');
  });
  it('should add with correct propertyname', async () => {
    const plugin = new TimestampPlugin('myTimestampProp');
    const output = plugin.process({});
    expect(output).to.have.property('myTimestampProp');
    expect(output).not.to.have.property('timestamp');
    expect(output.myTimestampProp).to.be.a('Date');
  });
});
