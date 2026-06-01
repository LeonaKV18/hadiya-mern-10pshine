import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FolderTree from './FolderTree';
import { createFolder } from '../../api/folders';

jest.mock('../../api/folders', () => ({
  createFolder: jest.fn(() => Promise.resolve()),
  renameFolder: jest.fn(() => Promise.resolve()),
  deleteFolder: jest.fn(() => Promise.resolve()),
  updateFolder: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const folders = [
  { id: 1, name: 'Work', color: null, children: [] },
  { id: 2, name: 'Personal', color: '#809684', children: [] },
];
const noop = () => {};

describe('FolderTree', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders existing folder names', () => {
    render(<FolderTree folders={folders} selected={null} onSelect={noop} onCreated={noop} onDeleteSelected={noop} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('shows an empty message when there are no folders', () => {
    render(<FolderTree folders={[]} selected={null} onSelect={noop} onCreated={noop} onDeleteSelected={noop} />);
    expect(screen.getByText('No folders yet')).toBeInTheDocument();
  });

  it('calls onSelect when a folder is clicked', () => {
    const onSelect = jest.fn();
    render(<FolderTree folders={folders} selected={null} onSelect={onSelect} onCreated={noop} onDeleteSelected={noop} />);
    fireEvent.click(screen.getByText('Work'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('rejects a duplicate name without calling the API', async () => {
    render(<FolderTree folders={folders} selected={null} onSelect={noop} onCreated={noop} onDeleteSelected={noop} />);
    fireEvent.click(screen.getByTitle('New folder'));
    const input = screen.getByPlaceholderText('Folder name...');
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('A folder with this name already exists.')).toBeInTheDocument();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('creates a folder with a unique name', async () => {
    const onCreated = jest.fn();
    render(<FolderTree folders={folders} selected={null} onSelect={noop} onCreated={onCreated} onDeleteSelected={noop} />);
    fireEvent.click(screen.getByTitle('New folder'));
    const input = screen.getByPlaceholderText('Folder name...');
    fireEvent.change(input, { target: { value: 'Studies' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(createFolder).toHaveBeenCalledWith('Studies', null));
    expect(onCreated).toHaveBeenCalled();
  });
});