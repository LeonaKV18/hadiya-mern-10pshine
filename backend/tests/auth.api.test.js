const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const sequelize = require('../src/config/db');
const { User } = require('../src/models/userModel');

require('../src/models/noteModel');

before(async function () {
  this.timeout(15000);
  // Connect to the db and create tables fresh for tests
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

after(async () => {
  await sequelize.close();
});

describe('POST /api/auth/register', () => {
  it('should return 400 if username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('should return 400 if email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: 'Password1' });

    expect(res.status).to.equal(400);
  });

  it('should return 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'Pass1' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('8 characters');
  });

  it('should return 409 if email is already registered', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 12);

    // Create user directly in db to simulate existing account
    await User.create({
      username: 'existing',
      email: 'duplicate@example.com',
      password_hash: hash,
      is_verified: true,
      verification_token: null,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', email: 'duplicate@example.com', password: 'Password1' });

    expect(res.status).to.equal(409);
  });

    it('should return 201 and send verification email on valid registration', async function () {
        this.timeout(10000);

        const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', email: 'newuser@example.com', password: 'Password1' });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.message).to.include('verify');
        expect(res.body.message).to.include('email');

        // Confirm user was created in the database with correct defaults
        const user = await User.findOne({ where: { email: 'newuser@example.com' } });
        expect(user).to.not.be.null;
        expect(user.username).to.equal('newuser');
        expect(user.is_verified).to.equal(false);
        expect(user.verification_token).to.be.a('string').with.lengthOf(64);
    });
});

describe('POST /api/auth/login', () => {
  let verifiedUser;

  before(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 12);

    // Create a verified user to test login against
    verifiedUser = await User.create({
      username: 'logintest',
      email: 'login@example.com',
      password_hash: hash,
      is_verified: true,
      verification_token: null,
    });
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass1' });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
  });

  it('should return 401 if user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });

    expect(res.status).to.equal(401);
  });

  it('should return 200 with token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password1' });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body).to.have.property('token');
    expect(res.body.user.email).to.equal('login@example.com');
  });

  it('should return 400 if email field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password1' });

    expect(res.status).to.equal(400);
  });
});

describe('POST /api/auth/login — unverified user', () => {
  before(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 12);

    await User.create({
      username: 'unverifieduser',
      email: 'unverified@example.com',
      password_hash: hash,
      is_verified: false,
      verification_token: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });
  });

  it('should return 403 if user email is not verified', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'Password1' });

    expect(res.status).to.equal(403);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.include('verify');
  });
});