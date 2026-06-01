const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

let folderService;
let getAllFoldersByUserStub;
let getFolderByIdStub;
let createFolderStub;
let updateFolderStub;
let deleteFolderStub;

beforeEach(() => {
  getAllFoldersByUserStub = sinon.stub();
  getFolderByIdStub = sinon.stub();
  createFolderStub = sinon.stub();
  updateFolderStub = sinon.stub();
  deleteFolderStub = sinon.stub();

  folderService = proxyquire('../src/services/folderService', {
    '../models/folderModel': {
      getAllFoldersByUser: getAllFoldersByUserStub,
      getFolderById: getFolderByIdStub,
      createFolder: createFolderStub,
      updateFolder: updateFolderStub,
      deleteFolder: deleteFolderStub,
    },
  });
});

afterEach(() => {
  sinon.restore();
});

describe('folderService.fetchFolderById', () => {
  it('should throw 404 if the folder does not exist', async () => {
    getFolderByIdStub.resolves(null);

    try {
      await folderService.fetchFolderById(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include('not found');
    }
  });

  it('should throw 403 if the folder belongs to a different user', async () => {
    getFolderByIdStub.resolves({ id: 1, user_id: 2, name: 'Other Folder' });

    try {
      // User 1 trying to access user 2's folder
      await folderService.fetchFolderById(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

  it('should return the folder if it belongs to the user', async () => {
    const folder = { id: 1, user_id: 1, name: 'My Folder' };
    getFolderByIdStub.resolves(folder);

    const result = await folderService.fetchFolderById(1, 1);
    expect(result).to.deep.equal(folder);
  });
});

describe('folderService.createNewFolder', () => {
  it('should throw 400 if name is empty', async () => {
    try {
      await folderService.createNewFolder(1, '', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('required');
    }
  });

  it('should throw 400 if name is only whitespace', async () => {
    try {
      await folderService.createNewFolder(1, '   ', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should throw 404 if parent_id is provided but parent does not exist', async () => {
    getFolderByIdStub.resolves(null);

    try {
      await folderService.createNewFolder(1, 'Child', 99);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include('Parent folder');
    }
  });

  it('should throw 404 if the parent folder belongs to a different user', async () => {
    getFolderByIdStub.resolves({ id: 99, user_id: 2, name: 'Other User Parent' });

    try {
      await folderService.createNewFolder(1, 'Child', 99);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should create a folder without a parent', async () => {
    const folder = { id: 1, user_id: 1, name: 'Work', parent_id: null };
    createFolderStub.resolves(folder);

    const result = await folderService.createNewFolder(1, '  Work  ', null);
    expect(createFolderStub.calledWith(1, 'Work', null)).to.be.true;
    expect(result).to.deep.equal(folder);
  });

  it('should create a nested folder when parent belongs to the same user', async () => {
    const parent = { id: 5, user_id: 1, name: 'Parent' };
    getFolderByIdStub.resolves(parent);
    const child = { id: 6, user_id: 1, name: 'Child', parent_id: 5 };
    createFolderStub.resolves(child);

    const result = await folderService.createNewFolder(1, 'Child', 5);
    expect(createFolderStub.calledWith(1, 'Child', 5)).to.be.true;
    expect(result).to.deep.equal(child);
  });
});

describe('folderService.renameFolder', () => {
  it('should throw 400 if new name is empty', async () => {
    getFolderByIdStub.resolves({ id: 1, user_id: 1, name: 'Old' });

    try {
      await folderService.renameFolder(1, 1, '');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('update');
    }
  });

  it('should throw 400 if new name is only whitespace', async () => {
    getFolderByIdStub.resolves({ id: 1, user_id: 1, name: 'Old' });

    try {
      await folderService.renameFolder(1, 1, '   ');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should rename the folder with trimmed name', async () => {
    const folder = { id: 1, user_id: 1, name: 'Old' };
    getFolderByIdStub.resolves(folder);
    updateFolderStub.resolves({ ...folder, name: 'New Name' });

    await folderService.renameFolder(1, 1, '  New Name  ');
    expect(updateFolderStub.calledWith(folder, { name: 'New Name' })).to.be.true;
  });
});

describe('folderService.removeFolder', () => {
  it('should throw 403 if folder belongs to a different user', async () => {
    getFolderByIdStub.resolves({ id: 1, user_id: 2, name: 'Other Folder' });

    try {
      await folderService.removeFolder(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

  it('should delete the folder if the user owns it', async () => {
    const folder = { id: 1, user_id: 1, name: 'Mine' };
    getFolderByIdStub.resolves(folder);
    deleteFolderStub.resolves();

    const result = await folderService.removeFolder(1, 1);
    expect(deleteFolderStub.calledWith(folder)).to.be.true;
    expect(result).to.be.true;
  });
});