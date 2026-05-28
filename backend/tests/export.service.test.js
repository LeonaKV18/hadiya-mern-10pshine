const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('exportService.generatePdf', () => {
  let exportService;
  let pageStub;
  let browserStub;
  let puppeteerStub;

  beforeEach(() => {
    // Fake page object returned by browser.newPage()
    pageStub = {
      setContent: sinon.stub().resolves(),
      pdf: sinon.stub().resolves(Buffer.from('fake-pdf-content')),
    };

    // Fake browser object returned by puppeteer.launch()
    browserStub = {
      newPage: sinon.stub().resolves(pageStub),
      close: sinon.stub().resolves(),
    };

    puppeteerStub = {
      launch: sinon.stub().resolves(browserStub),
    };

    exportService = proxyquire('../src/services/exportService', {
      puppeteer: puppeteerStub,
      'html-to-docx': sinon.stub().resolves(Buffer.from('fake-docx')),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return a Buffer containing the PDF', async () => {
    const result = await exportService.generatePdf('My Note', '<p>Note content here</p>');

    expect(Buffer.isBuffer(result)).to.be.true;
    expect(puppeteerStub.launch.calledOnce).to.be.true;
    expect(browserStub.newPage.calledOnce).to.be.true;
    expect(pageStub.setContent.calledOnce).to.be.true;
    expect(pageStub.pdf.calledOnce).to.be.true;
  });

  it('should always close the browser even if pdf() throws an error', async () => {
    pageStub.pdf.rejects(new Error('Chromium crashed'));

    try {
      await exportService.generatePdf('Title', '<p>Content</p>');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.message).to.equal('Chromium crashed');
      expect(browserStub.close.calledOnce).to.be.true;
    }
  });

  it('should render a fallback message when content is null', async () => {
    await exportService.generatePdf('Empty Note', null);

    const htmlPassed = pageStub.setContent.firstCall.args[0];
    expect(htmlPassed).to.include('This note has no content.');
  });

  it('should include the note title in the rendered HTML', async () => {
    await exportService.generatePdf('Important Title', '<p>Some content</p>');

    const htmlPassed = pageStub.setContent.firstCall.args[0];
    expect(htmlPassed).to.include('Important Title');
  });
});

describe('exportService.generateDocx', () => {
  let exportService;
  let htmlToDocxStub;

  beforeEach(() => {
    htmlToDocxStub = sinon.stub().resolves(Buffer.from('fake-docx-content'));

    exportService = proxyquire('../src/services/exportService', {
      puppeteer: { launch: sinon.stub() },
      'html-to-docx': htmlToDocxStub,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return a Buffer containing the DOCX', async () => {
    const result = await exportService.generateDocx('My Note', '<p>Content here</p>');

    expect(Buffer.isBuffer(result)).to.be.true;
    expect(htmlToDocxStub.calledOnce).to.be.true;
  });

  it('should pass the note title to html-to-docx options', async () => {
    await exportService.generateDocx('Note Title', '<p>Content</p>');

    const options = htmlToDocxStub.firstCall.args[2];
    expect(options.title).to.equal('Note Title');
  });

  it('should render a fallback message when content is null', async () => {
    await exportService.generateDocx('Empty', null);

    const htmlPassed = htmlToDocxStub.firstCall.args[0];
    expect(htmlPassed).to.include('This note has no content.');
  });
});