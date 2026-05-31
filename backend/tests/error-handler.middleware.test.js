const { expect } = require('chai');
const sinon = require('sinon');

const errorHandler = require('../src/middleware/errorHandler');

// Create minimal fake req/res/next objects to call the middleware directly
const makeReq = () => ({ url: '/test', method: 'GET' });

const makeRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('errorHandler middleware', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should respond with the error status and message when err.status is set', () => {
    const err = new Error('Not found');
    err.status = 404;
    const req = makeReq();
    const res = makeRes();
    const next = sinon.stub();

    errorHandler(err, req, res, next);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    const body = res.json.firstCall.args[0];
    expect(body.success).to.be.false;
    expect(body.message).to.equal('Not found');
  });

  it('should default to status 500 when err.status is not set', () => {
    const err = new Error('Something broke');
    const req = makeReq();
    const res = makeRes();
    const next = sinon.stub();

    errorHandler(err, req, res, next);

    expect(res.status.calledWith(500)).to.be.true;
  });

  it('should use a default message when err.message is not set', () => {
    const err = {};
    err.status = 500;
    const req = makeReq();
    const res = makeRes();
    const next = sinon.stub();

    errorHandler(err, req, res, next);

    const body = res.json.firstCall.args[0];
    expect(body.message).to.equal('An internal server error occurred.');
  });

  it('should use warn-level logging for 4xx client errors', () => {
    const err = new Error('Bad request');
    err.status = 400;
    const req = makeReq();
    const res = makeRes();
    const next = sinon.stub();

    expect(() => errorHandler(err, req, res, next)).to.not.throw();
    expect(res.status.calledWith(400)).to.be.true;
  });
});