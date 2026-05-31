const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { User } = require('../src/models/userModel');
const { Folder } = require('../src/models/folderModel');
const { Note } = require('../src/models/noteModel');

require('../src/models/attachmentModel');

let token;
let userId;

before(async function () {
  this.timeout(15000);

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Password1', 12);

  const user = await User.create({
    username: 'folderuser',
    email: 'folderuser@example.com',
    password_hash: hash,
    is_verified: true,
    verification_token: null,
  });

  userId = user.id;
  token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('POST /api/folders', () => {
  it('should return 401 without a token', async () => {
    const res = await request(app).post('/api/folders').send({ name: 'Work' });
    expect(res.status).to.equal(401);
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).to.equal(400);
  });

  it('should create a folder and return 201', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Personal' });
    expect(res.status).to.equal(201);
    expect(res.body.folder.name).to.equal('Personal');
    expect(res.body.folder.user_id).to.equal(userId);
  });

  it('should create a nested folder with a valid parent_id', async () => {
    const parent = await Folder.create({ user_id: userId, name: 'Parent' });

    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Child', parent_id: parent.id });

    expect(res.status).to.equal(201);
    expect(res.body.folder.parent_id).to.equal(parent.id);
  });
});

describe('GET /api/folders', () => {
  it('should return all folders for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/folders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.folders).to.be.an('array');
  });
});

describe('PUT /api/folders/:id', () => {
  let folderId;

  before(async () => {
    const folder = await Folder.create({ user_id: userId, name: 'Rename Me' });
    folderId = folder.id;
  });

  it('should rename the folder', async () => {
    const res = await request(app)
      .put(`/api/folders/${folderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed' });
    expect(res.status).to.equal(200);
    expect(res.body.folder.name).to.equal('Renamed');
  });
});

describe('DELETE /api/folders/:id', () => {
  let folderId;

  before(async () => {
    const folder = await Folder.create({ user_id: userId, name: 'Delete Me' });
    folderId = folder.id;
  });

  it('should delete the folder', async () => {
    const res = await request(app)
      .delete(`/api/folders/${folderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
  });

  it('should return 404 for a deleted folder', async () => {
    const res = await request(app)
      .get(`/api/folders/${folderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
  });
});