import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EventsList from './EventsList';
import Analytics from './Analytics';
import Chat from './Chat';
import './App.css';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <h1>EventHub</h1>
        <div className="nav-links">
          <Link to="/">Список подій</Link>
          <Link to="/analytics">Аналітика</Link>
          <Link to="/chat">Live Чат</Link>
        </div>
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<EventsList />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;