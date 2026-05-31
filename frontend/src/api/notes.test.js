import * as notesApi from './notes';
import client from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('notes api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getNotes calls GET /notes', () => {
    notesApi.getNotes();
    expect(client.get).toHaveBeenCalledWith('/notes');
  });

  it('togglePin PATCHes the pin endpoint', () => {
    notesApi.togglePin(12);
    expect(client.patch).toHaveBeenCalledWith('/notes/12/pin');
  });

  it('createNote sends folder_id null when none is given', () => {
    notesApi.createNote('T', '<p>c</p>');
    expect(client.post).toHaveBeenCalledWith('/notes', {
      title: 'T',
      content: '<p>c</p>',
      folder_id: null,
    });
  });

  it('searchNotes URL-encodes the query', () => {
    notesApi.searchNotes('a b');
    expect(client.get).toHaveBeenCalledWith('/notes/search?q=a%20b');
  });

  it('trashNote DELETEs the note', () => {
    notesApi.trashNote(5);
    expect(client.delete).toHaveBeenCalledWith('/notes/5');
  });
});