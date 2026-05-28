const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User } = require('../src/models/userModel');
const { Note } = require('../src/models/noteModel');

require('../src/models/folderModel');
require('../src/models/attachmentModel');

let token;
let userId;

before(async function () {
  this.timeout(15000);

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Password1', 12);

  const user = await User.create({
    username: 'searchuser',
    email: 'searchuser@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  userId = user.id;
  token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

  await Note.bulkCreate([
    { user_id: userId, title: 'Quarterly Budget', content: '<p>Finance review</p>' },
    { user_id: userId, title: 'Team Meeting Notes', content: '<p>Budget discussion</p>' },
    { user_id: userId, title: 'Grocery List', content: '<p>Apples and oranges</p>' },
  ]);
});

describe('GET /api/notes/search', () => {
  it('should return 400 if no query is provided', async () => {
    const res = await request(app)
      .get('/api/notes/search')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(400);
  });

  it('should return notes matching a title keyword', async () => {
    const res = await request(app)
      .get('/api/notes/search?q=Budget')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.notes.length).to.equal(2);
  });

  it('should return notes matching a content keyword', async () => {
    const res = await request(app)
      .get('/api/notes/search?q=Apples')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.notes.length).to.equal(1);
    expect(res.body.notes[0].title).to.equal('Grocery List');
  });

  it('should return an empty array when no notes match', async () => {
    const res = await request(app)
      .get('/api/notes/search?q=xyznotexist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.notes).to.be.an('array').that.is.empty;
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/notes/search?q=Budget');
    expect(res.status).to.equal(401);
  });
});