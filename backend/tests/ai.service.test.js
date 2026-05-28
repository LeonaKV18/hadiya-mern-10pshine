const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

let aiService;
let loggerStub;

beforeEach(() => {
  loggerStub = {
    error: sinon.stub(),
    info: sinon.stub(),
  };

  // Load aiService with a fake logger injected (so no log noise during tests)
  aiService = proxyquire('../src/services/aiService', {
    '../utils/logger': loggerStub,
  });
});

afterEach(() => {
  sinon.restore();
  delete global.fetch;
  // Restore API key after each test to avoid bleed-over between tests
  delete process.env.GEMINI_API_KEY;
});

describe('aiService.summariseNote — input validation', () => {
  it('should throw 500 if GEMINI_API_KEY is not set', async () => {
    // Make sure key is absent for this test
    delete process.env.GEMINI_API_KEY;

    try {
      await aiService.summariseNote('Title', 'Content long enough to pass length check here');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(500);
      expect(err.message).to.include('GEMINI_API_KEY');
    }
  });

  it('should throw 400 if content is empty', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';

    try {
      await aiService.summariseNote('Title', '');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('too short');
    }
  });

  it('should throw 400 if content is null', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';

    try {
      await aiService.summariseNote('Title', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if content is too short after stripping HTML', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';

    try {
      await aiService.summariseNote('Title', '<p><strong>Hi</strong></p>');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });
});

describe('aiService.summariseNote — Gemini API responses', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
  });

  it('should throw 502 if Gemini returns a non-OK HTTP status', async () => {
    global.fetch = sinon.stub().resolves({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    });

    try {
      await aiService.summariseNote(
        'Test',
        'This is a long enough piece of content to pass the minimum length validation check'
      );
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(502);
    }
  });

  it('should throw 502 if Gemini returns no candidates in response', async () => {
    global.fetch = sinon.stub().resolves({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
    });

    try {
      await aiService.summariseNote(
        'Test',
        'This is a long enough piece of content to pass the minimum length validation check'
      );
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(502);
      expect(err.message).to.include('summary');
    }
  });

  it('should throw 502 if Gemini response has no parts', async () => {
    global.fetch = sinon.stub().resolves({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [] } }],
      }),
    });

    try {
      await aiService.summariseNote(
        'Test',
        'This is a long enough piece of content to pass the minimum length validation check'
      );
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(502);
    }
  });

  it('should return the summary text on a successful Gemini response', async () => {
    global.fetch = sinon.stub().resolves({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'This is the generated summary.' }],
            },
          },
        ],
      }),
    });

    const result = await aiService.summariseNote(
      'My Note Title',
      'This is a long enough piece of content to pass the minimum length validation check'
    );

    expect(result).to.equal('This is the generated summary.');
  });

  it('should strip HTML tags from content before sending to Gemini', async () => {
    let capturedBody;
    global.fetch = sinon.stub().callsFake(async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Summary here.' }] } }],
        }),
      };
    });

    await aiService.summariseNote(
      'HTML Note',
      '<p>This is <strong>bold text</strong> and &amp; symbols that are long enough to pass</p>'
    );

    const prompt = capturedBody.contents[0].parts[0].text;
    // prompt should not contain raw HTML tags
    expect(prompt).to.not.include('<p>');
    expect(prompt).to.not.include('<strong>');
    // HTML entities should be decoded
    expect(prompt).to.include('&');
  });

  it('should use fallback model name if GEMINI_MODEL is not set', async () => {
    delete process.env.GEMINI_MODEL;
    let capturedUrl;
    global.fetch = sinon.stub().callsFake(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Summary.' }] } }],
        }),
      };
    });

    await aiService.summariseNote(
      'Title',
      'This is a long enough piece of content to pass the minimum length validation check'
    );

    expect(capturedUrl).to.include('gemini-3.5-flash');
  });
});