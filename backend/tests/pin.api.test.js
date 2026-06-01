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
    username: 'pinuser',
    email: 'pinuser@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });
  userId = user.id;
  token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('PATCH /api/notes/:id/pin', () => {
  let noteId;

  before(async () => {
    const note = await Note.create({ user_id: userId, title: 'Pin Me', content: '' });
    noteId = note.id;
  });

  it('should toggle is_pinned to true and persist it to the database', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}/pin`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);

    const reloaded = await Note.findByPk(noteId);
    expect(Boolean(reloaded.is_pinned)).to.equal(true);
  });

  it('should reflect the pinned state in GET /api/notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);
    const found = res.body.notes.find((n) => n.id === noteId);
    expect(found).to.exist;
    expect(Boolean(found.is_pinned)).to.equal(true);
  });

  it('should toggle is_pinned back to false', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}/pin`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(Boolean(res.body.note.is_pinned)).to.equal(false);
  });
});