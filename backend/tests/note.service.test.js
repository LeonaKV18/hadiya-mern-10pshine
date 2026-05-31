const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

let noteService;
let getNoteByIdStub;
let getTrashedNoteByIdStub;
let createNoteStub;
let updateNoteStub;
let deleteNoteStub;
let restoreNoteStub;
let permanentlyDeleteNoteStub;
let getAllNotesByUserStub;
let getTrashedNotesByUserStub;
let searchNotesByUserStub;

beforeEach(() => {
  getAllNotesByUserStub = sinon.stub();
  getTrashedNotesByUserStub = sinon.stub();
  getNoteByIdStub = sinon.stub();
  getTrashedNoteByIdStub = sinon.stub();
  searchNotesByUserStub = sinon.stub();
  createNoteStub = sinon.stub();
  updateNoteStub = sinon.stub();
  deleteNoteStub = sinon.stub();
  restoreNoteStub = sinon.stub();
  permanentlyDeleteNoteStub = sinon.stub();

  noteService = proxyquire('../src/services/noteService', {
    '../models/noteModel': {
      getAllNotesByUser: getAllNotesByUserStub,
      getTrashedNotesByUser: getTrashedNotesByUserStub,
      getNoteById: getNoteByIdStub,
      getTrashedNoteById: getTrashedNoteByIdStub,
      searchNotesByUser: searchNotesByUserStub,
      createNote: createNoteStub,
      updateNote: updateNoteStub,
      deleteNote: deleteNoteStub,
      restoreNote: restoreNoteStub,
      permanentlyDeleteNote: permanentlyDeleteNoteStub,
    },
  });
});

afterEach(() => {
  sinon.restore();
});

describe('noteService.fetchNoteById', () => {
  it('should throw 404 if the note does not exist', async () => {
    getNoteByIdStub.resolves(null);

    try {
      await noteService.fetchNoteById(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include('not found');
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 2, title: 'Someone else note' });

    try {
      // User 1 is trying to access user 2's note
      await noteService.fetchNoteById(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

  it('should return the note if it exists and belongs to the user', async () => {
    const note = { id: 1, user_id: 1, title: 'My Note' };
    getNoteByIdStub.resolves(note);

    const result = await noteService.fetchNoteById(1, 1);
    expect(result).to.deep.equal(note);
  });
});

describe('noteService.searchNotes', () => {
  it('should throw 400 if the search query is empty', async () => {
    try {
      await noteService.searchNotes(1, '');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('required');
    }
  });

  it('should throw 400 if the search query is only whitespace', async () => {
    try {
      await noteService.searchNotes(1, '   ');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should call the model with the trimmed query', async () => {
    searchNotesByUserStub.resolves([]);

    await noteService.searchNotes(1, '  hello  ');
    expect(searchNotesByUserStub.calledWith(1, 'hello')).to.be.true;
  });
});

describe('noteService.createNewNote', () => {
  it('should throw 400 if title is missing', async () => {
    try {
      await noteService.createNewNote(1, '', '<p>Content</p>', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('Title');
    }
  });

  it('should throw 400 if title is only whitespace', async () => {
    try {
      await noteService.createNewNote(1, '   ', '<p>Content</p>', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
    }
  });

  it('should create the note with trimmed title', async () => {
    const note = { id: 1, user_id: 1, title: 'My Note' };
    createNoteStub.resolves(note);

    const result = await noteService.createNewNote(1, '  My Note  ', '<p>Content</p>', null);
    expect(createNoteStub.calledWith(1, 'My Note', '<p>Content</p>', null)).to.be.true;
    expect(result).to.deep.equal(note);
  });
});

describe('noteService.updateExistingNote', () => {
  it('should throw 404 if the note does not exist', async () => {
    getNoteByIdStub.resolves(null);

    try {
      await noteService.updateExistingNote(99, 1, 'New Title', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 2, title: 'Other note' });

    try {
      await noteService.updateExistingNote(1, 1, 'New Title', null);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

  it('should throw 400 if neither title nor content is provided', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 1, title: 'My Note' });

    try {
      await noteService.updateExistingNote(1, 1, undefined, undefined);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include('at least');
    }
  });

  it('should update the note when only title is provided', async () => {
    const note = { id: 1, user_id: 1, title: 'Old Title' };
    getNoteByIdStub.resolves(note);
    updateNoteStub.resolves({ ...note, title: 'New Title' });

    await noteService.updateExistingNote(1, 1, 'New Title', undefined);
    expect(updateNoteStub.calledWith(note, { title: 'New Title' })).to.be.true;
  });
});

describe('noteService.autosaveNote', () => {
  it('should throw 404 if the note does not exist', async () => {
    getNoteByIdStub.resolves(null);

    try {
      await noteService.autosaveNote(99, 1, '<p>Content</p>');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 2, content: '' });

    try {
      await noteService.autosaveNote(1, 1, '<p>Content</p>');
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

it('should save the content when the user owns the note', async () => {
    const note = { id: 1, user_id: 1, content: 'old content' };
    getNoteByIdStub.resolves(note);
    updateNoteStub.resolves({ ...note, content: '<p>New</p>' });

    await noteService.autosaveNote(1, 1, { content: '<p>New</p>' });
    expect(updateNoteStub.calledWith(note, { content: '<p>New</p>' })).to.be.true;
  });

  it('should not change content when no new content is provided', async () => {
    const note = { id: 1, user_id: 1, content: 'existing content' };
    getNoteByIdStub.resolves(note);
    updateNoteStub.resolves(note);

    await noteService.autosaveNote(1, 1, {});
    expect(updateNoteStub.calledWith(note, {})).to.be.true;
  });
});

describe('noteService.trashNote', () => {
  it('should throw 404 if the note does not exist', async () => {
    getNoteByIdStub.resolves(null);

    try {
      await noteService.trashNote(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 2 });

    try {
      await noteService.trashNote(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });
});

describe('noteService.restoreTrashedNote', () => {
  it('should throw 404 if the note is not in trash', async () => {
    getTrashedNoteByIdStub.resolves(null);

    try {
      await noteService.restoreTrashedNote(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 404 if the note exists but has no deleted_at', async () => {
    // Note exists but was never trashed (paranoid fetch found it, but no deleted_at)
    getTrashedNoteByIdStub.resolves({ id: 1, user_id: 1, deleted_at: null });

    try {
      await noteService.restoreTrashedNote(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the trashed note belongs to a different user', async () => {
    getTrashedNoteByIdStub.resolves({ id: 1, user_id: 2, deleted_at: new Date() });

    try {
      await noteService.restoreTrashedNote(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });
});

describe('noteService.permanentlyDeleteExistingNote', () => {
  it('should throw 404 if the note is not found', async () => {
    getTrashedNoteByIdStub.resolves(null);

    try {
      await noteService.permanentlyDeleteExistingNote(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getTrashedNoteByIdStub.resolves({ id: 1, user_id: 2, deleted_at: new Date() });

    try {
      await noteService.permanentlyDeleteExistingNote(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });
});

describe('noteService.togglePinNote', () => {
  it('should throw 404 if the note does not exist', async () => {
    getNoteByIdStub.resolves(null);
    try {
      await noteService.togglePinNote(99, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(404);
    }
  });

  it('should throw 403 if the note belongs to a different user', async () => {
    getNoteByIdStub.resolves({ id: 1, user_id: 2, is_pinned: false });
    try {
      await noteService.togglePinNote(1, 1);
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err.status).to.equal(403);
    }
  });

  it('should flip is_pinned from false to true', async () => {
    const note = { id: 1, user_id: 1, is_pinned: false };
    getNoteByIdStub.resolves(note);
    updateNoteStub.resolves({ ...note, is_pinned: true });
    await noteService.togglePinNote(1, 1);
    expect(updateNoteStub.calledWith(note, { is_pinned: true })).to.be.true;
  });

  it('should flip is_pinned from true to false', async () => {
    const note = { id: 1, user_id: 1, is_pinned: true };
    getNoteByIdStub.resolves(note);
    updateNoteStub.resolves({ ...note, is_pinned: false });
    await noteService.togglePinNote(1, 1);
    expect(updateNoteStub.calledWith(note, { is_pinned: false })).to.be.true;
  });
});