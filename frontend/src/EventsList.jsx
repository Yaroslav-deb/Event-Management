import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EventsList() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/events?page=1&limit=10`)
            .then(res => setEvents(res.data.data || []))
            .catch(err => console.error("Помилка завантаження подій:", err));
    }, []);

    return (
        <div>
            <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Афіша подій</h2>
            <div className="events-grid">
                {events?.map(event => (
                    <div className="card event-card" key={event._id}>
                        <h3>{event.title}</h3>
                        <p>{event.description || 'Опис відсутній'}</p>
                        <div className="badge">
                            👤 {event.organizer || 'Організатор не вказаний'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}