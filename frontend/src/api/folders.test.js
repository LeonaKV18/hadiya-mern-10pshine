import * as foldersApi from './folders';
import client from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('folders api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFolders calls GET /folders', () => {
    foldersApi.getFolders();
    expect(client.get).toHaveBeenCalledWith('/folders');
  });

  it('createFolder defaults parent and color to null', () => {
    foldersApi.createFolder('Work');
    expect(client.post).toHaveBeenCalledWith('/folders', { name: 'Work', parent_id: null, color: null });
  });

  it('createFolder passes through parent and color', () => {
    foldersApi.createFolder('Child', 5, '#809684');
    expect(client.post).toHaveBeenCalledWith('/folders', { name: 'Child', parent_id: 5, color: '#809684' });
  });

  it('renameFolder puts the new name', () => {
    foldersApi.renameFolder(3, 'New');
    expect(client.put).toHaveBeenCalledWith('/folders/3', { name: 'New' });
  });

  it('updateFolder puts arbitrary fields', () => {
    foldersApi.updateFolder(3, { color: '#9D7A90' });
    expect(client.put).toHaveBeenCalledWith('/folders/3', { color: '#9D7A90' });
  });

  it('deleteFolder deletes by id', () => {
    foldersApi.deleteFolder(7);
    expect(client.delete).toHaveBeenCalledWith('/folders/7');
  });
});