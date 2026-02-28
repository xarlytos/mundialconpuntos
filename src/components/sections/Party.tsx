import { useState, useRef, useEffect } from 'react';
import { Header } from '../home/Header';
import { MobileLayout } from '../../features/fantasy/presentation/shared/MobileLayout';
import './Party.css';

interface PartyProps {
  onNavigate: (view: string) => void;
  points: number;
}

interface Message {
  id: number;
  user: string;
  avatar: string;
  message: string;
  time: string;
  country: string;
}

export const Party = ({ onNavigate, points }: PartyProps) => {
  const [inRoom, setInRoom] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: 'Carlos', avatar: '👨', message: '¡GOOOOOL de México! 🎉🇲🇽', time: '12:34', country: '🇲🇽' },
    { id: 2, user: 'Sarah', avatar: '👩', message: 'What a goal! Amazing play! 🔥', time: '12:34', country: '🇺🇸' },
    { id: 3, user: 'Diego', avatar: '🧑', message: 'Vamos México!! 💚🤍❤️', time: '12:35', country: '🇲🇽' },
    { id: 4, user: 'Thabo', avatar: '👨🏿', message: 'Good game from both sides 👏', time: '12:35', country: '🇿🇦' },
    { id: 5, user: 'Ana', avatar: '👩🏻', message: 'El portero está increíble hoy 🧤', time: '12:36', country: '🇪🇸' },
    { id: 6, user: 'Luis', avatar: '🧔', message: 'Mejor partido hasta ahora! ⚽', time: '12:36', country: '🇦🇷' },
    { id: 7, user: 'Emma', avatar: '👱‍♀️', message: 'México playing beautifully! 💫', time: '12:37', country: '🇬🇧' },
    { id: 8, user: 'Miguel', avatar: '👨🏽', message: 'Necesitamos otro gol para estar tranquilos 😅', time: '12:37', country: '🇲🇽' },
    { id: 9, user: 'Yuki', avatar: '👨🏻', message: 'すごい！Amazing football! 🇯🇵⚽', time: '12:38', country: '🇯🇵' },
    { id: 10, user: 'Isabella', avatar: '👩🏽', message: 'Que jogada espetacular! 🇧🇷', time: '12:38', country: '🇧🇷' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [viewers, setViewers] = useState(143);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Eliminar padding/margin del body y root cuando Party se monta
  useEffect(() => {
    const root = document.getElementById('root');
    const body = document.body;

    if (root) {
      root.style.padding = '0';
      root.style.margin = '0';
    }
    if (body) {
      body.style.padding = '0';
      body.style.margin = '0';
      body.style.overflow = 'auto';
    }

    return () => {
      // Restaurar estilos al desmontar
      if (root) {
        root.style.padding = '';
        root.style.margin = '';
      }
      if (body) {
        body.style.padding = '';
        body.style.margin = '';
        body.style.overflow = '';
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (inRoom) {
      scrollToBottom();
    }
  }, [messages, inRoom]);

  useEffect(() => {
    if (inRoom) {
      // Simular mensajes entrantes
      const interval = setInterval(() => {
        const randomMessages = [
          { user: 'Pedro', avatar: '👨🏽', message: '¡Vamos por el segundo! 💪', country: '🇲🇽' },
          { user: 'John', avatar: '👨🏼', message: 'Great match so far! 👍', country: '🇺🇸' },
          { user: 'Maria', avatar: '👩🏻', message: 'Qué emoción! 🔥', country: '🇪🇸' },
          { user: 'Sipho', avatar: '👨🏿', message: 'We need to push harder! 💪', country: '🇿🇦' },
          { user: 'André', avatar: '🧔🏻', message: 'Increíble jugada! ⚡', country: '🇧🇷' },
          { user: 'Yuki', avatar: '👨🏻', message: 'Amazing football! ⚽✨', country: '🇯🇵' },
          { user: 'Sophie', avatar: '👱‍♀️', message: 'The atmosphere is electric! ⚡', country: '🇫🇷' },
          { user: 'Marco', avatar: '🧑🏻', message: 'Che partita! Fantastico! 🇮🇹', country: '🇮🇹' },
          { user: 'Kim', avatar: '👩🏻', message: '대단해요! Great play! 🎊', country: '🇰🇷' },
          { user: 'Ahmed', avatar: '👨🏽', message: 'What a save! 🧤✨', country: '🇪🇬' },
          { user: 'Olga', avatar: '👩🏼', message: 'Невероятно! Incredible! 🌟', country: '🇷🇺' },
          { user: 'Raj', avatar: '👨🏾', message: 'Superb technique! 👏', country: '🇮🇳' },
          { user: 'Liam', avatar: '🧔🏼', message: 'That was brilliant! 💎', country: '🇦🇺' },
          { user: 'Fatima', avatar: '👩🏽', message: 'جميل! Beautiful goal! ⚽', country: '🇸🇦' },
          { user: 'Hans', avatar: '👨🏼', message: 'Wunderbar! 🎯', country: '🇩🇪' },
        ];

        const random = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        const newMsg: Message = {
          id: Date.now(),
          ...random,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMsg]);
        setViewers(prev => prev + Math.floor(Math.random() * 5));
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [inRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msg: Message = {
        id: Date.now(),
        user: 'Tú',
        avatar: '😊',
        message: newMessage,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        country: '🇲🇽',
      };
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    }
  };

  if (inRoom) {
    return (
      <div className="party-container">
        {/* Header */}
        <Header points={points} />

        <div className="chat-room">
          {/* Header */}
          <div className="chat-header">
            <button
              onClick={() => setInRoom(false)}
              className="chat-back-button"
            >
              ← Salir de la sala
            </button>
            <div className="chat-match-info">
              <div className="chat-match-teams">
                <span className="flag-small">🇲🇽</span>
                <span>México 1-0 Sudáfrica</span>
                <span className="flag-small">🇿🇦</span>
              </div>
              <div className="chat-viewers">
                <span className="live-indicator"></span>
                {viewers} viendo
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <div className="message-avatar">{msg.avatar}</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-user">{msg.user}</span>
                    <span className="message-country">{msg.country}</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                  <div className="message-text">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="chat-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
  );
}

  return (
    <MobileLayout onNavigate={onNavigate} currentView="party">
      <div className="party-container">
        {/* Banner Image */}
        <div className="party-banner-container">
          <img
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80"
            alt="Party Banner"
            className="party-banner-image"
          />
          <div className="party-banner-overlay" />
        </div>

        {/* Header */}
        <Header points={points} />

        <div className="party-content">
          {/* Back button */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="absolute left-6 top-6 group flex items-center gap-2 text-gray-400 hover:text-[#FFE600] transition-all duration-300 z-10"
          >
            <div className="w-14 h-14 rounded-full bg-[#141414] border border-[#252525] flex items-center justify-center group-hover:border-[#FFE600]/30 group-hover:bg-[#FFE600]/5 transition-all">
              <span className="text-2xl">←</span>
            </div>
            <span className="hidden md:block text-xs font-bold tracking-widest uppercase">Volver</span>
          </button>

          {/* Monitor Icon */}
          <div className="monitor-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>

          {/* Title */}
          <h1 className="party-title">Watch Party</h1>
          <p className="party-subtitle">Ve el partido con fans de todo el mundo</p>

          {/* Match Card */}
          <div className="match-card">
            <div className="match-info">
              <span className="flag">🇲🇽</span>
              <span className="match-teams">México 1-0 Sudáfrica</span>
              <span className="flag">🇿🇦</span>
            </div>
            <div className="viewers-count">34 · {viewers} viendo</div>
          </div>

          {/* Join Button */}
          <button onClick={() => setInRoom(true)} className="join-button">
            UNIRME A LA SALA
          </button>

          {/* Create Private Room Button */}
          <button className="private-button">
            🔒 Crear sala privada
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};
