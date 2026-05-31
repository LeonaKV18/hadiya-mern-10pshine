import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { register as registerApi } from '../api/auth';
import toast from 'react-hot-toast';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('../api/auth', () => ({ register: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const renderPage = () => render(<MemoryRouter><RegisterPage /></MemoryRouter>);
const fill = () => {
  fireEvent.change(screen.getByPlaceholderText('e.g. jane_smith'), { target: { value: 'jane' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Min 8 chars, uppercase, number'), { target: { value: 'Password1' } });
};

describe('RegisterPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows validation errors when fields are empty', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(registerApi).not.toHaveBeenCalled();
  });

  it('shows the success screen after registering', async () => {
    registerApi.mockResolvedValue({ data: { message: 'Check your email.' } });
    renderPage();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
    expect(registerApi).toHaveBeenCalledWith('jane', 'jane@example.com', 'Password1');
  });

  it('shows an error toast when registration fails', async () => {
    registerApi.mockRejectedValue({ response: { data: { message: 'Email taken' } } });
    renderPage();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email taken'));
  });
});