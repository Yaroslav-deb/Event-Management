import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(API_URL);

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.on('chat_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        return () => socket.off('chat_message');
    }, []);

    const sendMessage = () => {
        if (input.trim()) {
            socket.emit('chat_message', input);
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="card chat-container">
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>Служба підтримки</h2>
            
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                        Напишіть перше повідомлення...
                    </p>
                ) : (
                    messages.map((m, i) => (
                        <div className="message-bubble" key={i}>
                            {m}
                        </div>
                    ))
                )}
            </div>

            <div className="chat-input-area">
                <input 
                    className="chat-input"
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ваше повідомлення..."
                />
                <button className="btn-primary" onClick={sendMessage}>
                    Надіслати
                </button>
            </div>
        </div>
    );
}