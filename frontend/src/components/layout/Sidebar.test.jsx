import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from './Sidebar';
import { deleteAccount } from '../../api/user';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ children, to, title }) => (
    <a href={to} title={title}>{typeof children === 'function' ? null : children}</a>
  ),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'jane', email: 'jane@x.com' }, logout: mockLogout }),
}));
jest.mock('../../api/user', () => ({ deleteAccount: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../folders/FolderTree', () => () => <div data-testid="folder-tree" />);

const baseProps = {
  folders: [
    { id: 1, name: 'Favorites', is_system: true },
    { id: 2, name: 'My Folder', is_system: false },
  ],
  onFolderSelect: jest.fn(),
  selectedFolder: null,
  onFolderCreated: jest.fn(),
  isCollapsed: false,
  onCollapsedChange: jest.fn(),
};

describe('Sidebar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders brand, user, system folders and tree', () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByText('PlumPad')).toBeInTheDocument();
    expect(screen.getByText('jane')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByTestId('folder-tree')).toBeInTheDocument();
  });

  it('selects a system folder', () => {
    render(<Sidebar {...baseProps} />);
    fireEvent.click(screen.getByTitle('Favorites'));
    expect(baseProps.onFolderSelect).toHaveBeenCalledWith(1);
  });

  it('logs out', () => {
    render(<Sidebar {...baseProps} />);
    fireEvent.click(screen.getByTitle('Log Out'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('toggles collapse', () => {
    render(<Sidebar {...baseProps} />);
    fireEvent.click(screen.getByTitle('Collapse sidebar'));
    expect(baseProps.onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('deletes the account after confirming', async () => {
    deleteAccount.mockResolvedValue({});
    render(<Sidebar {...baseProps} />);
    fireEvent.click(screen.getByTitle('Delete account'));
    fireEvent.click(screen.getByText('Delete permanently'));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalled());
    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows an error when deletion fails', async () => {
    const toast = require('react-hot-toast').default;
    deleteAccount.mockRejectedValueOnce(new Error('fail'));
    render(<Sidebar {...baseProps} />);
    fireEvent.click(screen.getByTitle('Delete account'));
    fireEvent.click(screen.getByText('Delete permanently'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete account.'));
  });
});