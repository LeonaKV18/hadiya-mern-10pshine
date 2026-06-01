import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty once loading settles', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('login stores user and token in state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ id: 1, username: 'jane' }, 'jwt-token'));
    expect(result.current.user).toEqual({ id: 1, username: 'jane' });
    expect(result.current.token).toBe('jwt-token');
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 1, username: 'jane' });
  });

  it('logout clears state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ id: 1 }, 'jwt'));
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('restores a saved session on mount', () => {
    localStorage.setItem('token', 'saved-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 9, username: 'bob' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBe('saved-jwt');
    expect(result.current.user).toEqual({ id: 9, username: 'bob' });
  });

  it('throws when used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider');
    spy.mockRestore();
  });
});