import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';
import { verifyEmail } from '../api/auth';

jest.mock('../api/auth', () => ({ verifyEmail: jest.fn() }));

const renderAt = (entry) => render(<MemoryRouter initialEntries={[entry]}><VerifyEmailPage /></MemoryRouter>);

describe('VerifyEmailPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows failure when no token is present', () => {
    renderAt('/verify-email');
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('shows success when the token verifies', async () => {
    verifyEmail.mockResolvedValue({});
    renderAt('/verify-email?token=goodtoken');
    expect(await screen.findByText('Email Verified!')).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith('goodtoken');
  });

  it('shows failure when verification rejects', async () => {
    verifyEmail.mockRejectedValue({ response: { data: { message: 'Link expired' } } });
    renderAt('/verify-email?token=badtoken');
    expect(await screen.findByText('Link expired')).toBeInTheDocument();
  });
});