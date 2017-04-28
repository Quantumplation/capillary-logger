import sinon = require('sinon');
import sinonChai = require('sinon-chai');
import * as zurvan from 'zurvan';
import * as chai from 'chai';

const expect = chai.expect;
chai.use(sinonChai);

import { InMemoryPlugin, AddPropertyPlugin, DummyAsyncPlugin, FilterPlugin } from '../helpers';
import { Logger, NullLogger } from '../../src/logger';

describe('Logger', async () => {
  let sandbox: sinon.SinonSandbox;
  let logger: Logger;
  before(async () => {
    await zurvan.interceptTimers();
  });
  beforeEach(async () => {
    logger = new Logger();
    sandbox = sinon.sandbox.create();
  });
  afterEach(async () => {
    sandbox.restore();
  });
  after(async () => {
    await zurvan.releaseTimers();
  });
  it('should log to console by default', async () => {
    sandbox.stub(console, 'log');
    logger.info('some message');
    expect(console.log).to.have.been.called;
  });
  describe('With in memory plugin', async () => {
    let inMemoryPlugin: InMemoryPlugin;
    beforeEach(async () => {
      inMemoryPlugin = new InMemoryPlugin();
      logger.addPlugin(inMemoryPlugin);
    });
    it('should wrap string message as object', async () => {
      logger.info('some message');
      expect(inMemoryPlugin.messages.length).to.equal(1);
      expect(inMemoryPlugin.messages[0]).to.have.property('message', 'some message');
    });
    it('should inject severity property', async () => {
      const inMemory = new InMemoryPlugin();
      logger.addPlugin(inMemory);
      logger.trace('a');
      logger.debug('b');
      logger.info('c');
      logger.warn('d');
      logger.error('e');
      logger.fatal('f');
      expect(inMemoryPlugin.messages.length).to.equal(6);
      expect(inMemoryPlugin.messages[0]).to.eql({ message: 'a', severity: 'trace' });
      expect(inMemoryPlugin.messages[1]).to.eql({ message: 'b', severity: 'debug' });
      expect(inMemoryPlugin.messages[2]).to.eql({ message: 'c', severity: 'info' });
      expect(inMemoryPlugin.messages[3]).to.eql({ message: 'd', severity: 'warn' });
      expect(inMemoryPlugin.messages[4]).to.eql({ message: 'e', severity: 'error' });
      expect(inMemoryPlugin.messages[5]).to.eql({ message: 'f', severity: 'fatal' });
    });
    it('should include context in messages', async () => {
      logger = new Logger({ someProp: 1, otherProp: 'a' });
      logger.addPlugin(inMemoryPlugin);
      logger.info('some message');
      expect(inMemoryPlugin.messages.length).to.equal(1);
      expect(inMemoryPlugin.messages[0]).to.eql({
        message: 'some message',
        severity: 'info',
        someProp: 1,
        otherProp: 'a',
      });
    });
    describe('Child loggers', async () => {
      let child: Logger;
      beforeEach(async () => {
        logger.context = { someProp: 1 };
        child = logger.split({ childProp: 2 });
      });
      it('should use same plugins', async () => {
        child.info('some message');
        expect(inMemoryPlugin.messages.length).to.equal(1);
      });
      it('should include child context', async () => {
        child.info('some message');
        expect(inMemoryPlugin.messages[0]).to.have.property('childProp', 2);
      });
      it('should include parent context', async () => {
        child.info('some message');
        expect(inMemoryPlugin.messages[0]).to.have.property('someProp', 1);
      });
      it('should respect changed parent context', async () => {
        logger.context.someProp = 2;
        child.info('some message');
        expect(inMemoryPlugin.messages[0].someProp).to.equal(2);
      });
    });
    describe('Plugins', async () => {
      beforeEach(async () => {
        logger = new Logger();
      });
      it('should process all plugins', async () => {
        logger.addPlugin(new AddPropertyPlugin('myProp', 1));
        logger.addPlugin(inMemoryPlugin);

        logger.info('some message');
        expect(inMemoryPlugin.messages.length).to.equal(1);
        expect(inMemoryPlugin.messages[0]).to.have.property('myProp', 1);
      });
      it('should process plugins in order', async () => {
        logger.addPlugin(new AddPropertyPlugin('myProp', 1));
        logger.addPlugin(new AddPropertyPlugin('myProp', 2));
        logger.addPlugin(inMemoryPlugin);

        logger.info('some message');
        expect(inMemoryPlugin.messages.length).to.equal(1);
        expect(inMemoryPlugin.messages[0]).to.have.property('myProp', 2);
      });
      it('should process sync plugins synchronously', async () => {
        const inMemory1 = new InMemoryPlugin();
        const inMemory2 = new InMemoryPlugin();
        const async1 = new DummyAsyncPlugin();
        const inMemory3 = new InMemoryPlugin();
        const async2 = new DummyAsyncPlugin();
        logger.addPlugin(inMemory1);
        logger.addPlugin(inMemory2);
        logger.addPlugin(async1);
        logger.addPlugin(inMemory3);
        logger.addPlugin(async2);

        const promise = logger.logAsync('info', 'some message');
        expect(inMemory1.messages.length).to.equal(1);
        expect(inMemory2.messages.length).to.equal(1);
        expect(async1.awaitingMessages.length).to.equal(1);
        expect(inMemory3.messages.length).to.equal(0);
        expect(async2.awaitingMessages.length).to.equal(0);

        let pendingMessage = async1.awaitingMessages[0];
        pendingMessage.deferred.resolve(pendingMessage.message);
        await zurvan.waitForEmptyQueue();

        expect(inMemory3.messages.length).to.equal(1);
        expect(async2.awaitingMessages.length).to.equal(1);
        pendingMessage = async2.awaitingMessages[0];
        pendingMessage.deferred.resolve(pendingMessage.message);
        await promise;
      });

      it('should stop processing plugins if one returns null or undefined', async () => {
        const inMemoryBefore = new InMemoryPlugin();
        const filter = new FilterPlugin(message => message.severity === 'fatal');
        const inMemoryAfter = new InMemoryPlugin();

        logger.addPlugin(inMemoryBefore);
        logger.addPlugin(filter);
        logger.addPlugin(inMemoryAfter);

        logger.log('fatal', '[useful message]');
        logger.log('trace', '[useless log-cluttering message]');

        expect(inMemoryBefore.messages.length).to.equal(2);
        expect(inMemoryAfter.messages.length).to.equal(1);
        expect(inMemoryAfter.messages[0]).to.have.property('message', '[useful message]');
      });
    });
  });
  describe('Null Logger', async () => {
    it('should return a null logger from orDefault', async () => {
      const nullLogger = Logger.orDefault(null);
      expect(nullLogger).to.be.an.instanceOf(NullLogger);
    });
    it('should not return null logger for logger sent to orDefault', async () => {
      const notNullLogger = Logger.orDefault(logger);
      expect(notNullLogger).to.equal(logger);
    });
    it('should not log anything', async () => {
      sandbox.stub(console, 'log');
      const nullLogger = Logger.orDefault(null);
      nullLogger.info('some message');
      expect(console.log).not.to.have.been.called;
    });
    it('should not log anything to plugins', async () => {
      const inMemory = new InMemoryPlugin();
      const nullLogger = Logger.orDefault(null);
      nullLogger.addPlugin(inMemory);
      nullLogger.info('some message');
      expect(inMemory.messages.length).to.equal(0);
    });
    it('should spawn itself as a child', async () => {
      const nullLogger = Logger.orDefault(null);
      const child = nullLogger.split({ a: 1 });
      expect(child).to.equal(nullLogger);
    });
  });
});
