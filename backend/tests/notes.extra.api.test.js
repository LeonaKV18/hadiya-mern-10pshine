const request = require('supertest');
const { expect } = require('chai');

const { app } = require('../server');
const { Note } = require('../src/models/noteModel');
const { createTestUser, createToken, authHeader } = require('./helpers/testAuth');

describe('Extra note behavior', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let noteA;

  before(async () => {
    userA = await createTestUser({
      username: 'extrausera',
      email: 'extrausera@example.com',
    });

    userB = await createTestUser({
      username: 'extrauserb',
      email: 'extrauserb@example.com',
    });

    tokenA = createToken(userA);
    tokenB = createToken(userB);

    noteA = await Note.create({
      user_id: userA.id,
      title: 'Autosave Note',
      content: 'Old autosave content',
    });
  });

    it('should autosave note content', async () => {
    const newContent = '<p>Autosaved content</p>';

    const res = await request(app)
        .patch(`/api/notes/${noteA.id}/autosave`)
        .set(authHeader(tokenA))
        .send({ content: newContent });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.saved_at).to.exist;

    const updatedNote = await Note.findByPk(noteA.id);
    expect(updatedNote.content).to.equal(newContent);
    });

  it('should prevent another user from autosaving someone else’s note', async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteA.id}/autosave`)
      .set(authHeader(tokenB))
      .send({ content: 'Malicious edit' });

    expect(res.status).to.equal(403);
  });

  it('should keep /api/notes/search from being treated as /api/notes/:id', async () => {
    const res = await request(app)
      .get('/api/notes/search?q=Autosave')
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.be.an('array');
  });

  it('should keep /api/notes/trash from being treated as /api/notes/:id', async () => {
    const res = await request(app)
      .get('/api/notes/trash')
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.be.an('array');
  });
});