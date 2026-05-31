import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockEditor = {
  getHTML: jest.fn(() => '<p>body</p>'),
  isDestroyed: false,
  commands: { setContent: jest.fn() },
};

jest.mock('@tiptap/react', () => ({
  useEditor: () => mockEditor,
  EditorContent: () => <div data-testid="editor-content" />,
}));
jest.mock('@tiptap/starter-kit', () => ({ __esModule: true, default: { configure: () => ({}) } }));
jest.mock('@tiptap/extension-underline', () => ({ __esModule: true, default: {} }));
jest.mock('@tiptap/extension-text-align', () => ({ __esModule: true, default: { configure: () => ({}) } }));
jest.mock('@tiptap/extension-highlight', () => ({ __esModule: true, default: { configure: () => ({}) } }));
jest.mock('@tiptap/extension-text-style', () => ({ TextStyle: {}, FontSize: {}, Color: {}, FontFamily: {} }));
jest.mock('@tiptap/extension-image', () => ({ __esModule: true, default: { configure: () => ({}) } }));
jest.mock('@tiptap/extension-subscript', () => ({ __esModule: true, default: {} }));
jest.mock('@tiptap/extension-superscript', () => ({ __esModule: true, default: {} }));
jest.mock('@tiptap/extension-table', () => ({ Table: { configure: () => ({}) } }));
jest.mock('@tiptap/extension-table-row', () => ({ __esModule: true, default: {} }));
jest.mock('@tiptap/extension-table-header', () => ({ __esModule: true, default: {} }));
jest.mock('@tiptap/extension-table-cell', () => ({ __esModule: true, default: {} }));
jest.mock('../components/editor/EditorToolbar', () => () => <div data-testid="toolbar" />);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { fromFolder: null } }),
}));
jest.mock('../api/notes', () => ({
  getNoteById: jest.fn(), updateNote: jest.fn(), autosaveNote: jest.fn(),
  summarizeNote: jest.fn(), exportNote: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

import NoteEditorPage from './NoteEditorPage';
import { getNoteById, updateNote, summarizeNote, exportNote } from '../api/notes';
const toast = require('react-hot-toast').default;

describe('NoteEditorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockEditor.isDestroyed = false;
    mockEditor.getHTML.mockReturnValue('<p>body</p>');

    getNoteById.mockResolvedValue({
      data: {
        note: {
          id: 1,
          title: 'My Note',
          content: '<p>c</p>',
        },
      },
    });
  });

  it('loads the note title', async () => {
    render(<NoteEditorPage />);
    expect(await screen.findByDisplayValue('My Note')).toBeInTheDocument();
  });

  it('redirects when the note is missing', async () => {
    getNoteById.mockRejectedValueOnce(new Error('nope'));
    render(<NoteEditorPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('saves the note', async () => {
    updateNote.mockResolvedValue({});
    render(<NoteEditorPage />);
    await screen.findByDisplayValue('My Note');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(updateNote).toHaveBeenCalledWith('1', 'My Note', '<p>body</p>'));
    expect(toast.success).toHaveBeenCalledWith('Note saved.');
  });

  it('blocks saving with an empty title', async () => {
    render(<NoteEditorPage />);
    const input = await screen.findByDisplayValue('My Note');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Note must have a title.'));
    expect(updateNote).not.toHaveBeenCalled();
  });

  it('summarizes the note', async () => {
    summarizeNote.mockResolvedValue({ data: { summary: 'Short summary.' } });
    render(<NoteEditorPage />);
    await screen.findByDisplayValue('My Note');
    fireEvent.click(screen.getByText('Summarize'));
    expect(await screen.findByText('Short summary.')).toBeInTheDocument();
  });

  it('shows an error when summarizing fails', async () => {
    summarizeNote.mockRejectedValueOnce({ response: { data: { message: 'Too short.' } } });
    render(<NoteEditorPage />);
    await screen.findByDisplayValue('My Note');
    fireEvent.click(screen.getByText('Summarize'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Too short.'));
  });

  it('exports as PDF', async () => {
    exportNote.mockResolvedValue({ data: new Blob(['x']) });
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
    render(<NoteEditorPage />);
    await screen.findByDisplayValue('My Note');
    fireEvent.click(screen.getByText('Export PDF'));
    await waitFor(() => expect(exportNote).toHaveBeenCalledWith('1', 'pdf'));
  });
});