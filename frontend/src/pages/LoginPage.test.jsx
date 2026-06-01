import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { login as loginApi } from '../api/auth';
import toast from 'react-hot-toast';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));
jest.mock('../api/auth', () => ({ login: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const renderPage = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows validation errors when submitting empty fields', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
  });

  it('logs in and navigates on success', async () => {
    loginApi.mockResolvedValue({ data: { user: { id: 1 }, token: 'jwt' } });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Your password'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(loginApi).toHaveBeenCalledWith('jane@example.com', 'Password1'));
    expect(mockLogin).toHaveBeenCalledWith({ id: 1 }, 'jwt');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an error toast when login fails', async () => {
    loginApi.mockRejectedValue({ response: { data: { message: 'Bad creds' } } });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Your password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Bad creds'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});