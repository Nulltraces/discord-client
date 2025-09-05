"use client";
import axios from 'axios';
import { api } from '../lib/api';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AuthView({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    try {
      setError('');
      if (mode === 'login') {
        const { data } = await api.post(`/auth/login`, { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        const { data } = await api.post(`/auth/register`, { email, password, username });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      onAuthenticated();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed');
    }
  }

  return (
    <div className="m-auto w-full max-w-md space-y-4 p-6 rounded-lg bg-neutral-800">
      <h1 className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Register'}</h1>
      <div className="space-y-2">
        <label className="block text-sm">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded bg-neutral-700 outline-none" />
      </div>
      {mode === 'register' && (
        <div className="space-y-2">
          <label className="block text-sm">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 rounded bg-neutral-700 outline-none" />
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded bg-neutral-700 outline-none" />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded">{mode === 'login' ? 'Login' : 'Sign up'}</button>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="px-4 py-2 bg-neutral-700 rounded">
          Switch to {mode === 'login' ? 'Sign up' : 'Login'}
        </button>
      </div>
    </div>
  );
}

