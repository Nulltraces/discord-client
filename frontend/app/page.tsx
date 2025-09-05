"use client";
import { useState } from 'react';
import AuthView from '../components/AuthView';
import ChatView from '../components/ChatView';

export default function Home() {
  const [authed, setAuthed] = useState<boolean>(false);
  return (
    <main className="h-screen flex">
      {!authed ? (
        <AuthView onAuthenticated={() => setAuthed(true)} />
      ) : (
        <ChatView />
      )}
    </main>
  );
}

