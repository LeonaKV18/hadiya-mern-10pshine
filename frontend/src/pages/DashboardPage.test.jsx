import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { getNotes, createNote, trashNote, searchNotes, togglePin } from '../api/notes';
import { getFolders } from '../api/folders';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));
jest.mock('../api/notes', () => ({
  getNotes: jest.fn(), createNote: jest.fn(), trashNote: jest.fn(),
  searchNotes: jest.fn(), updateNote: jest.fn(), togglePin: jest.fn(),
}));
jest.mock('../api/folders', () => ({ getFolders: jest.fn() }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'jane' } }) }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../components/layout/Sidebar', () => (props) => (
  <button data-testid="folder-1" onClick={() => props.onFolderSelect(1)}>sidebar</button>
));
jest.mock('../components/notes/NoteCard', () => (props) => (
  <div data-testid="note-card">
    <span>{props.note.title}</span>
    <button onClick={() => props.onTrash(props.note.id)}>{`trash-${props.note.id}`}</button>
    <button onClick={() => props.onPin(props.note.id)}>{`pin-${props.note.id}`}</button>
  </div>
));

const notesFixture = [
  { id: 1, title: 'Alpha', content: '', folder_id: null, is_pinned: true },
  { id: 2, title: 'Beta', content: '', folder_id: 5, is_pinned: false },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    getNotes.mockResolvedValue({ data: { notes: notesFixture } });
    getFolders.mockResolvedValue({ data: { folders: [{ id: 5, name: 'Work' }] } });
  });

  it('loads notes and shows the pinned section', async () => {
    render(<DashboardPage />);
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
  });

  it('shows an error toast when notes fail to load', async () => {
    const toast = require('react-hot-toast').default;
    getNotes.mockRejectedValueOnce(new Error('fail'));
    render(<DashboardPage />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load notes.'));
  });

  it('creates a note and navigates to it', async () => {
    createNote.mockResolvedValue({ data: { note: { id: 99 } } });
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByText(/New Note/i));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes/99', expect.anything()));
  });

  it('searches notes', async () => {
    searchNotes.mockResolvedValue({ data: { notes: [notesFixture[0]] } });
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.change(screen.getByPlaceholderText('Search notes...'), { target: { value: 'Alpha' } });
    await waitFor(() => expect(searchNotes).toHaveBeenCalledWith('Alpha'));
    expect(await screen.findByText(/Results for/)).toBeInTheDocument();
  });

  it('clears search when query is blank', async () => {
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.change(screen.getByPlaceholderText('Search notes...'), { target: { value: '   ' } });
    await waitFor(() => expect(searchNotes).not.toHaveBeenCalled());
  });

  it('trashes a note from a card', async () => {
    trashNote.mockResolvedValue({});
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByText('trash-1'));
    await waitFor(() => expect(trashNote).toHaveBeenCalledWith(1));
  });

  it('pins a note from a card', async () => {
    togglePin.mockResolvedValue({});
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByText('pin-2'));
    await waitFor(() => expect(togglePin).toHaveBeenCalledWith(2));
  });

  it('asks for a folder filter from the sidebar', async () => {
    render(<DashboardPage />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByTestId('folder-1'));
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('shows the empty state', async () => {
    getNotes.mockResolvedValue({ data: { notes: [] } });
    render(<DashboardPage />);
    expect(await screen.findByText('No notes yet.')).toBeInTheDocument();
  });
});