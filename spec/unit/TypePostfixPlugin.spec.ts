import { expect } from 'chai';

import { TypePostfixPlugin } from '../../src/plugins/TypePostfixPlugin';

describe('Type Postfix plugin', async () => {
  function expectPostfix(obj: any, property: string, postfix: string, value: any) {
    expect(obj).not.to.have.property(property);
    expect(obj).to.have.property(property + postfix);
    expect(obj[property + postfix]).to.eql(value);
  }
  let plugin: TypePostfixPlugin;
  beforeEach(async () => {
    plugin = new TypePostfixPlugin();
  });
  it('should prefix top level string properties', async () => {
    const output = plugin.process({ message: 'some message' });
    expectPostfix(output, 'message', '_s', 'some message');
  });
  it('should prefix top level number properties', async () => {
    const output = plugin.process({ value: 1 });
    expectPostfix(output, 'value', '_n', 1);
  });
  it('should prefix top level object properties', async () => {
    const output = plugin.process({ value: { a: 1 } });
    expectPostfix(output, 'value', '_o', { a: 1 });
  });
  it('should prefix top level date properties', async () => {
    const date = new Date();
    const output = plugin.process({ dt: date });
    expectPostfix(output, 'dt', '_dt', date);
  });
  it('should allow explicit mappings', async () => {
    plugin = new TypePostfixPlugin(undefined, { myProp: 'myPrefix_' });
    const output = plugin.process({ myProp: 'abc' });
    expectPostfix(output, 'myProp', 'myPrefix_', 'abc');
  });
  it('should allow prefixes to be overridden', async () => {
    plugin = new TypePostfixPlugin({ number: 'xyz'});
    const output = plugin.process({ x: 1, y: 'abc' });
    expectPostfix(output, 'x', 'xyz', 1);
    expectPostfix(output, 'y', '_s', 'abc');
  });
});
