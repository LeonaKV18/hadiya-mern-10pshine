import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from './NoteCard';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock('../../api/notes', () => ({ updateNote: jest.fn(() => Promise.resolve()) }));

const baseNote = {
  id: 7,
  title: 'My Title',
  content: '<p>Hello <strong>world</strong></p>',
  updated_at: '2026-01-01T00:00:00Z',
  is_pinned: false,
  folder_id: null,
};

describe('NoteCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the title and a plain-text preview', () => {
    render(<NoteCard note={baseNote} onTrash={jest.fn()} onPin={jest.fn()} />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('calls onPin with the note id without navigating', () => {
    const onPin = jest.fn();
    render(<NoteCard note={baseNote} onTrash={jest.fn()} onPin={onPin} />);
    fireEvent.click(screen.getByTitle('Pin note'));
    expect(onPin).toHaveBeenCalledWith(7);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls onTrash with the note id', () => {
    const onTrash = jest.fn();
    render(<NoteCard note={baseNote} onTrash={onTrash} onPin={jest.fn()} />);
    fireEvent.click(screen.getByTitle('Move to trash'));
    expect(onTrash).toHaveBeenCalledWith(7);
  });

  it('navigates to the note when the card body is clicked', () => {
    render(<NoteCard note={baseNote} onTrash={jest.fn()} onPin={jest.fn()} />);
    fireEvent.click(screen.getByText('My Title'));
    expect(mockNavigate).toHaveBeenCalledWith('/notes/7');
  });

  it('shows Untitled when the note has no title', () => {
    render(<NoteCard note={{ ...baseNote, title: '' }} onTrash={jest.fn()} onPin={jest.fn()} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('renders a folder badge when folderName is provided', () => {
    render(<NoteCard note={baseNote} onTrash={jest.fn()} onPin={jest.fn()} folderName="Work" />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});