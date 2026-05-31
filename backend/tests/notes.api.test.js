const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User } = require('../src/models/userModel');
const { Note } = require('../src/models/noteModel');

// Ensure Note model and associations are loaded
require('../src/models/noteModel');

let tokenA;
let tokenB;
let userA;
let userB;

before(async function () {
  this.timeout(15000);

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Password1', 12);

  // Create two separate users to test cross-user access restrictions
  userA = await User.create({
    username: 'userA',
    email: 'userA@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  userB = await User.create({
    username: 'userB',
    email: 'userB@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  // Generate tokens manually — no need to log in via HTTP for test setup
  tokenA = jwt.sign({ id: userA.id, username: userA.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  tokenB = jwt.sign({ id: userB.id, username: userB.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('GET /api/notes', () => {
  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).to.equal(401);
  });

  it('should return 200 with an empty array when user has no notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.be.an('array').that.is.empty;
  });
});

describe('POST /api/notes', () => {
  it('should return 401 without a token', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test', content: 'Content' });

    expect(res.status).to.equal(401);
  });

  it('should return 400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'No title here' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('Title');
  });

  it('should create a note and return 201 with valid input', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'My Note', content: '<p>Hello</p>' });

    expect(res.status).to.equal(201);
    expect(res.body.note.title).to.equal('My Note');
    expect(res.body.note.user_id).to.equal(userA.id);
  });
});

describe('GET /api/notes/:id', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({
      user_id: userA.id,
      title: 'UserA Note',
      content: 'Private content',
    });
    noteId = note.id;
  });

  it('should return the note for its owner', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).to.equal(200);
    expect(res.body.note.id).to.equal(noteId);
  });

  it('should return 403 if a different user tries to access the note', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).to.equal(403);
  });

  it('should return 404 for a note that does not exist', async () => {
    const res = await request(app)
      .get('/api/notes/99999')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).to.equal(404);
  });
});

describe('PUT /api/notes/:id', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({
      user_id: userA.id,
      title: 'To Update',
      content: 'Old content',
    });
    noteId = note.id;
  });

  it('should update the note for its owner', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated Title' });

    expect(res.status).to.equal(200);
    expect(res.body.note.title).to.equal('Updated Title');
  });

  it('should return 403 if a different user tries to update the note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked' });

    expect(res.status).to.equal(403);
  });
});

describe('DELETE /api/notes/:id', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({
      user_id: userA.id,
      title: 'To Delete',
      content: '',
    });
    noteId = note.id;
  });

  it('should return 403 if a different user tries to delete the note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).to.equal(403);
  });

  it('should move the note to trash for its owner and return 200', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.include('trash');
  });

  it('should return 404 when trying to delete an already deleted note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).to.equal(404);
  });
});