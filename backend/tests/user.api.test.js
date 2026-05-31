const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User } = require('../src/models/userModel');

require('../src/models/noteModel');
require('../src/models/folderModel');
require('../src/models/attachmentModel');

let token;
let userId;

before(async function () {
  this.timeout(15000);

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Password1', 12);

  const user = await User.create({
    username: 'prefuser',
    email: 'prefuser@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  userId = user.id;
  token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('GET /api/users/me', () => {
  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).to.equal(401);
  });

  it('should return the current user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.user.email).to.equal('prefuser@example.com');
    expect(res.body.user).to.not.have.property('password_hash');
  });
});

describe('PATCH /api/users/preferences', () => {
  it('should return 400 for an invalid theme value', async () => {
    const res = await request(app)
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'rainbow' });
    expect(res.status).to.equal(400);
  });

  it('should update theme to dark', async () => {
    const res = await request(app)
      .patch('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark' });
    expect(res.status).to.equal(200);
    expect(res.body.preferences.theme).to.equal('dark');
  });

  it('should persist the preference across calls', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.user.preferences.theme).to.equal('dark');
  });
});