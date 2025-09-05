"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const WS = (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000');

type Server = { id: string; name: string };
type Channel = { id: string; name: string; serverId: string };
type Message = { id: string; content: string; authorId: string; channelId: string; createdAt: string; author?: { username: string; avatarUrl?: string } };

export default function ChatView() {
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const accessToken = useMemo(() => localStorage.getItem('accessToken') || '', []);
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  useEffect(() => {
    const s = io(WS, { auth: { token: accessToken } });
    socketRef.current = s;
    s.on('connect', () => {});
    s.on('message:new', (msg: Message) => {
      setMessages(prev => (currentChannel && msg.channelId === currentChannel.id ? [...prev, msg] : prev));
    });
    s.on('message:updated', (msg: Message) => {
      setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, content: msg.content } : m)));
    });
    s.on('message:deleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });
    return () => { s.disconnect(); };
  }, [accessToken]);

  useEffect(() => {
    api.get(`/servers`).then(({ data }) => {
      setServers(data);
      if (data[0]) setCurrentServer(data[0]);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!currentServer) return;
    api.get(`/channels/${currentServer.id}`).then(({ data }) => {
      setChannels(data);
      if (data[0]) setCurrentChannel(data[0]);
    });
  }, [currentServer, accessToken]);

  useEffect(() => {
    if (!currentChannel || !socketRef.current) return;
    socketRef.current.emit('channel:join', { channelId: currentChannel.id });
    api.get(`/messages/${currentChannel.id}`).then(({ data }) => setMessages(data));
  }, [currentChannel, accessToken]);

  function sendMessage() {
    if (!input.trim() || !socketRef.current || !currentChannel) return;
    socketRef.current.emit('message:send', { channelId: currentChannel.id, content: input });
    setInput('');
  }

  function editMessage(messageId: string, content: string) {
    if (!socketRef.current) return;
    socketRef.current.emit('message:edit', { messageId, content });
  }

  function deleteMessage(messageId: string) {
    if (!socketRef.current) return;
    socketRef.current.emit('message:delete', { messageId });
  }

  return (
    <div className="flex w-full">
      <aside className="w-16 bg-neutral-800 p-2 space-y-2">
        {servers.map(s => (
          <button key={s.id} onClick={() => setCurrentServer(s)} className={`w-12 h-12 rounded-full ${currentServer?.id===s.id?'bg-indigo-600':'bg-neutral-700'}`}>{s.name[0]}</button>
        ))}
      </aside>
      <aside className="w-56 bg-neutral-800 p-3 space-y-1 border-r border-neutral-700">
        <div className="font-semibold mb-2">{currentServer?.name || 'Servers'}</div>
        {channels.map(c => (
          <button key={c.id} onClick={() => setCurrentChannel(c)} className={`w-full text-left px-2 py-1 rounded ${currentChannel?.id===c.id?'bg-neutral-700':'hover:bg-neutral-800'}`}># {c.name}</button>
        ))}
      </aside>
      <section className="flex-1 flex flex-col">
        <header className="h-12 border-b border-neutral-700 flex items-center px-4"># {currentChannel?.name}</header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className="group flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-neutral-700 flex items-center justify-center">
                {m.author?.username?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <div className="text-sm text-neutral-400">{m.author?.username || m.authorId} <span className="text-xs">{new Date(m.createdAt).toLocaleTimeString()}</span></div>
                <div>{m.content}</div>
              </div>
              {m.authorId === user.id && (
                <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                  <button className="text-xs px-2 py-1 bg-neutral-700 rounded" onClick={() => {
                    const c = prompt('Edit message', m.content);
                    if (c != null) editMessage(m.id, c);
                  }}>Edit</button>
                  <button className="text-xs px-2 py-1 bg-red-700 rounded" onClick={() => deleteMessage(m.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <footer className="p-3 border-t border-neutral-700 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder="Message #channel" className="flex-1 px-3 py-2 rounded bg-neutral-800 outline-none" />
          <button onClick={sendMessage} className="px-4 py-2 bg-indigo-600 rounded">Send</button>
        </footer>
      </section>
    </div>
  );
}

