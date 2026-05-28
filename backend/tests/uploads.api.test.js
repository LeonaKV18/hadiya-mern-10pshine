const request = require('supertest');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

const { app } = require('../server');
const { Note } = require('../src/models/noteModel');
const { Attachment } = require('../src/models/attachmentModel');
const { createTestUser, createToken, authHeader } = require('./helpers/testAuth');

describe('File uploads', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let noteA;
  let fixtureDir;
  let imagePath;
  let textPath;

  before(async () => {
    userA = await createTestUser({
      username: 'uploadusera',
      email: 'uploadusera@example.com',
    });

    userB = await createTestUser({
      username: 'uploaduserb',
      email: 'uploaduserb@example.com',
    });

    tokenA = createToken(userA);
    tokenB = createToken(userB);

    noteA = await Note.create({
      user_id: userA.id,
      title: 'Upload Note',
      content: 'This note will receive attachments.',
    });

    fixtureDir = path.join(__dirname, 'fixtures');
    fs.mkdirSync(fixtureDir, { recursive: true });

    imagePath = path.join(fixtureDir, 'sample.png');
    textPath = path.join(fixtureDir, 'sample.txt');

    fs.writeFileSync(
      imagePath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBApUe0p8AAAAASUVORK5CYII=',
        'base64'
      )
    );

    fs.writeFileSync(textPath, 'This is a text file and should be rejected.');
  });

  it('should return 401 when uploading without token', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/attachments`);

    expect(res.status).to.equal(401);
  });

  it('should upload an allowed image file', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenA))
      .attach('file', imagePath);

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.attachment.original_name).to.equal('sample.png');
    expect(res.body.attachment.note_id).to.equal(noteA.id);
    expect(res.body.attachment.user_id).to.equal(userA.id);
  });

  it('should list attachments for the note owner', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.body.attachments).to.be.an('array');
    expect(res.body.attachments.length).to.be.greaterThan(0);
  });

  it('should reject unsupported file types', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenA))
      .attach('file', textPath);

    expect(res.status).to.equal(400);
  });

  it("should prevent another user from uploading to someone else's note", async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenB))
      .attach('file', imagePath);

    expect(res.status).to.equal(403);
  });

  it('should return 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('No file');
  });

  it("should prevent another user from listing attachments of someone else's note", async () => {
    const res = await request(app)
      .get(`/api/notes/${noteA.id}/attachments`)
      .set(authHeader(tokenB));

    expect(res.status).to.equal(403);
  });

  it('should return 404 when uploading to a note that does not exist', async () => {
    const res = await request(app)
      .post('/api/notes/999999/attachments')
      .set(authHeader(tokenA))
      .attach('file', imagePath);

    expect(res.status).to.equal(404);
  });

  it("should prevent another user from deleting someone else's attachment", async () => {
    const attachment = await Attachment.create({
      user_id: userA.id,
      note_id: noteA.id,
      original_name: 'owned-by-a.png',
      stored_name: 'owned-by-a.png',
      mimetype: 'image/png',
      size: 100,
      path: imagePath,
    });

    const res = await request(app)
      .delete(`/api/notes/attachments/${attachment.id}`)
      .set(authHeader(tokenB));

    expect(res.status).to.equal(403);
  });

  it('should return 404 when deleting an attachment that does not exist', async () => {
    const res = await request(app)
      .delete('/api/notes/attachments/999999')
      .set(authHeader(tokenA));

    expect(res.status).to.equal(404);
  });

  it('should delete an attachment owned by the user', async () => {
    const attachment = await Attachment.findOne({
      where: {
        user_id: userA.id,
        note_id: noteA.id,
      },
    });

    const res = await request(app)
      .delete(`/api/notes/attachments/${attachment.id}`)
      .set(authHeader(tokenA));

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);

    const deleted = await Attachment.findByPk(attachment.id);
    expect(deleted).to.equal(null);
  });
});