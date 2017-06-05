import { expect } from 'chai';

import { MinimumSeverityPlugin } from '../../src/plugins/MinimumSeverityPlugin';

describe('Minimum severity plugin', () => {
  it('should allow messages above the minimum severity', () => {
    const plugin = new MinimumSeverityPlugin('info');
    const message = { message: 'o aint an int', severity: 'error' };
    expect(plugin.process(message)).to.equal(message);
  });

  it('should allow messages at the minimum severity', () => {
    const plugin = new MinimumSeverityPlugin('info');
    const message = {
      number: 47,
      message:
        'Cats use their whiskers to detect if they can fit through a space',
      severity: 'info',
    };
    expect(plugin.process(message)).to.equal(message);
  });

  it('should reject messages below the minimum severity', () => {
    const plugin = new MinimumSeverityPlugin('info');
    const message = { message: 'this is fine', severity: 'trace' };
    expect(plugin.process(message)).to.be.null;
  });
});
