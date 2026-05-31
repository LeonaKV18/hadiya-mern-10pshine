import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrashPage from './TrashPage';
import { getTrashedNotes, restoreNote, permanentlyDeleteNote } from '../api/notes';
import { getFolders } from '../api/folders';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('../api/notes', () => ({
  getTrashedNotes: jest.fn(), restoreNote: jest.fn(), permanentlyDeleteNote: jest.fn(),
}));
jest.mock('../api/folders', () => ({ getFolders: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../components/layout/Sidebar', () => () => <div data-testid="sidebar" />);

const trashed = [
  { id: 1, title: 'Old A', deleted_at: '2026-01-01' },
  { id: 2, title: '', deleted_at: '2026-01-02' },
];

describe('TrashPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTrashedNotes.mockResolvedValue({ data: { notes: trashed } });
    getFolders.mockResolvedValue({ data: { folders: [] } });
  });

  it('lists trashed notes', async () => {
    render(<TrashPage />);
    expect(await screen.findByText('Old A')).toBeInTheDocument();
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    getTrashedNotes.mockResolvedValue({ data: { notes: [] } });
    render(<TrashPage />);
    expect(await screen.findByText('Trash is empty.')).toBeInTheDocument();
  });

  it('restores a note', async () => {
    restoreNote.mockResolvedValue({});
    render(<TrashPage />);
    await screen.findByText('Old A');
    fireEvent.click(screen.getAllByText('Restore')[0]);
    await waitFor(() => expect(restoreNote).toHaveBeenCalledWith(1));
  });

  it('permanently deletes after confirming', async () => {
    permanentlyDeleteNote.mockResolvedValue({});
    render(<TrashPage />);
    await screen.findByText('Old A');
    fireEvent.click(screen.getAllByText('Delete')[0]);
    fireEvent.click(await screen.findByText('Delete permanently'));
    await waitFor(() => expect(permanentlyDeleteNote).toHaveBeenCalledWith(1));
  });

  it('bulk restores', async () => {
    restoreNote.mockResolvedValue({});
    render(<TrashPage />);
    await screen.findByText('Old A');
    fireEvent.click(screen.getByText('Select all'));
    fireEvent.click(screen.getByText('Restore selected'));
    await waitFor(() => expect(restoreNote).toHaveBeenCalledTimes(2));
  });

  it('bulk deletes after confirming', async () => {
    permanentlyDeleteNote.mockResolvedValue({});
    render(<TrashPage />);
    await screen.findByText('Old A');
    fireEvent.click(screen.getByText('Select all'));
    fireEvent.click(screen.getByText('Delete selected'));
    fireEvent.click(await screen.findByText('Delete permanently'));
    await waitFor(() => expect(permanentlyDeleteNote).toHaveBeenCalledTimes(2));
  });
});