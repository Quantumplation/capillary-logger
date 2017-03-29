import sinon = require('sinon');
import sinonChai = require('sinon-chai');
import { expect, use as ChaiUse } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

ChaiUse(sinonChai);

import { TypePrefixPlugin } from '../../src/plugins/TypePrefixPlugin';

describe('Type Prefix plugin', async () => {
  function expectPrefix(obj: any, property: string, prefix: string, value: any) {
    expect(obj).not.to.have.property(property);
    expect(obj).to.have.property(prefix + property);
    expect(obj[prefix + property]).to.eql(value);
  }
  let plugin: TypePrefixPlugin;
  beforeEach(async () => {
    plugin = new TypePrefixPlugin();
  });
  it('should prefix top level string properties', async () => {
    const output = plugin.process({ message: 'some message' });
    expectPrefix(output, 'message', 's_', 'some message');
  });
  it('should prefix top level number properties', async () => {
    const output = plugin.process({ value: 1 });
    expectPrefix(output, 'value', 'n_', 1);
  });
  it('should prefix top level object properties', async () => {
    const output = plugin.process({ value: { a: 1 } });
    expectPrefix(output, 'value', 'o_', { a: 1 });
  });
  it('should prefix top level date properties', async () => {
    const date = new Date();
    const output = plugin.process({ dt: date });
    expectPrefix(output, 'dt', 'dt_', date);
  });
  it('should allow explicit mappings', async () => {
    plugin = new TypePrefixPlugin(undefined, { myProp: 'myPrefix_' });
    const output = plugin.process({ myProp: 'abc' });
    expectPrefix(output, 'myProp', 'myPrefix_', 'abc');
  });
  it('should allow prefixes to be overridden', async () => {
    plugin = new TypePrefixPlugin({ number: 'xyz'});
    const output = plugin.process({ x: 1, y: 'abc' });
    expectPrefix(output, 'x', 'xyz', 1);
    expectPrefix(output, 'y', 's_', 'abc');
  });
});