const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

// Stubs that replace real dependencies
let findByEmailStub;
let createUserStub;
let findByVerificationTokenStub;
let markAsVerifiedStub;
let sendVerificationEmailStub;
let authService;

// Rebuild fresh stubs before each test and reload authService with those stubs injected
beforeEach(() => {
  findByEmailStub = sinon.stub();
  createUserStub = sinon.stub();
  findByVerificationTokenStub = sinon.stub();
  markAsVerifiedStub = sinon.stub();
  sendVerificationEmailStub = sinon.stub().resolves();

  // proxyquire loads authService and replaces its dependencies with the stubs
  authService = proxyquire('../src/services/authService', {
    '../models/userModel': {
      findByEmail: findByEmailStub,
      createUser: createUserStub,
      findByVerificationToken: findByVerificationTokenStub,
      markAsVerified: markAsVerifiedStub,
    },
    '../utils/emailService': {
      sendVerificationEmail: sendVerificationEmailStub,
    },
  });
});

afterEach(() => {
  sinon.restore();
});

describe('authService.register', () => {
  it('should throw 400 if username is missing', async () => {
    try {
      await authService.register('', 'test@example.com', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('required');
    }
  });

  it('should throw 400 if password is missing', async () => {
    try {
      await authService.register('testuser', 'test@example.com', '');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if username format is invalid', async () => {
    try {
      await authService.register('ab', 'test@example.com', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('Username');
    }
  });

  it('should throw 400 if email format is invalid', async () => {
    try {
      await authService.register('testuser', 'not-an-email', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if password is too short', async () => {
    try {
      await authService.register('testuser', 'test@example.com', 'Pass1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('8 characters');
    }
  });

  it('should throw 400 if password has no uppercase letter', async () => {
    try {
      await authService.register('testuser', 'test@example.com', 'password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if password has no lowercase letter', async () => {
    try {
        await authService.register('testuser', 'test@example.com', 'PASSWORD1');
        expect.fail('Expected error was not thrown');
    } catch (err) {
        expect(err.status).to.equal(400);
        expect(err.message).to.include('lowercase');
    }
    });

  it('should throw 400 if password has no number', async () => {
    try {
      await authService.register('testuser', 'test@example.com', 'Password');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 409 if email is already registered', async () => {
    // Simulating finding an existing user in the database
    findByEmailStub.resolves({ id: 1, email: 'test@example.com' });

    try {
      await authService.register('testuser', 'test@example.com', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(409);
      expect(err.message).to.include('already exists');
    }
  });

  it('should normalize email to lowercase and trim whitespace', async () => {
    findByEmailStub.resolves(null);
    createUserStub.resolves({ id: 1, username: 'testuser', email: 'test@example.com' });
    await authService.register('testuser', '  Test@Example.com  ', 'Password1');
    expect(findByEmailStub.calledWith('test@example.com')).to.be.true;
    });

  it('should create user and send verification email on valid input', async () => {
    // Simulate no existing user found
    findByEmailStub.resolves(null);
    // Simulate user being created successfully
    createUserStub.resolves({ id: 1, username: 'testuser', email: 'test@example.com' });

    const result = await authService.register('testuser', 'test@example.com', 'Password1');

    expect(createUserStub.calledOnce).to.be.true;
    expect(sendVerificationEmailStub.calledOnce).to.be.true;
    expect(result.message).to.include('verify');
  });
});

describe('authService.login', () => {
  it('should throw 400 if email is missing', async () => {
    try {
      await authService.login('', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if password is missing', async () => {
    try {
        await authService.login('test@example.com', '');
        expect.fail('Expected error was not thrown');
    } catch (err) {
        expect(err.status).to.equal(400);
    }
    });

  it('should throw 401 if user is not found', async () => {
    findByEmailStub.resolves(null);

    try {
      await authService.login('test@example.com', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(401);
      expect(err.message).to.equal('Invalid email or password.');
    }
  });

  it('should throw 401 if password does not match', async () => {
    // bcrypt.hash used directly here to create a real hash for testing comparison
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('CorrectPass1', 12);

    findByEmailStub.resolves({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hash,
      is_verified: true,
    });

    try {
      await authService.login('test@example.com', 'WrongPass1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(401);
    }
  });

  it('should throw 403 if user email is not verified', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 12);

    findByEmailStub.resolves({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hash,
      is_verified: false,
    });

    try {
      await authService.login('test@example.com', 'Password1');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
      expect(err.message).to.include('verify');
    }
  });

  it('should return a token and user data on successful login', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 12);

    findByEmailStub.resolves({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hash,
      is_verified: true,
    });

    const result = await authService.login('test@example.com', 'Password1');

    expect(result).to.have.property('token');
    expect(result.user).to.have.property('id', 1);
    expect(result.user).to.not.have.property('password_hash');
  });
});

describe('authService.verifyEmail', () => {
  it('should throw 400 if token is missing', async () => {
    try {
      await authService.verifyEmail('');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 400 if token is not found in database', async () => {
    findByVerificationTokenStub.resolves(null);

    try {
      await authService.verifyEmail('nonexistent_token');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('Invalid');
    }
  });

  it('should mark user as verified and return success message', async () => {
    findByVerificationTokenStub.resolves({ id: 1, email: 'test@example.com' });
    markAsVerifiedStub.resolves();

    const result = await authService.verifyEmail('valid_token');

    expect(markAsVerifiedStub.calledWith(1)).to.be.true;
    expect(result.message).to.include('verified');
  });
});