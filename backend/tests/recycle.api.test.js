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
    username: 'trashuser',
    email: 'trashuser@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  userId = user.id;
  token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('DELETE /api/notes/:id (soft delete)', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({ user_id: userId, title: 'Soft Delete Me', content: '' });
    noteId = note.id;
  });

  it('should soft delete the note and return 200', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.include('trash');
  });

  it('should no longer appear in GET /api/notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);
    const ids = res.body.notes.map((n) => n.id);
    expect(ids).to.not.include(noteId);
  });

  it('should appear in GET /api/notes/trash', async () => {
    const res = await request(app)
      .get('/api/notes/trash')
      .set('Authorization', `Bearer ${token}`);
    const ids = res.body.notes.map((n) => n.id);
    expect(ids).to.include(noteId);
  });
});

describe('POST /api/notes/:id/restore', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({ user_id: userId, title: 'Restore Me', content: '' });
    // Soft delete it first
    await note.destroy();
    noteId = note.id;
  });

  it('should restore the note from trash', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteId}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.include('restored');
  });

  it('should appear in GET /api/notes after restore', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);
    const ids = res.body.notes.map((n) => n.id);
    expect(ids).to.include(noteId);
  });
});

describe('DELETE /api/notes/:id/permanent', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({ user_id: userId, title: 'Permanent Delete', content: '' });
    await note.destroy();
    noteId = note.id;
  });

  it('should permanently delete the note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}/permanent`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
  });

  it('should not appear in trash after permanent delete', async () => {
    const res = await request(app)
      .get('/api/notes/trash')
      .set('Authorization', `Bearer ${token}`);
    const ids = res.body.notes.map((n) => n.id);
    expect(ids).to.not.include(noteId);
  });
});