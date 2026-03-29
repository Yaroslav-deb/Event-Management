import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Event, Participant, User } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Успішне підключення до MongoDB'))
    .catch(err => console.error('Помилка підключення до БД:', err));

app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.status(401).json({ error: 'Неавторизовано. Будь ласка, увійдіть у систему.' });
};

app.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const candidate = await User.findOne({ email });
        if (candidate) return res.status(400).json({ message: 'Користувач вже існує' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role: role || 'Organizer' });
        await user.save();
        res.status(201).json({ message: 'Користувача створено успішно' });
    } catch (e) { res.status(500).json({ message: 'Помилка при реєстрації' }); }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Невірний логін або пароль' });
        }
        req.session.user = { id: user._id, email: user.email, role: user.role };
        res.json({ message: 'Вхід виконано успішно', user: req.session.user });
    } catch (e) { res.status(500).json({ message: 'Помилка при вході' }); }
});

app.get('/events', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const events = await Event.find().skip(skip).limit(parseInt(limit));
        const total = await Event.countDocuments();
        res.json({ total, page, limit, data: events });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/events', isAuthenticated, async (req, res) => {
    try {
        const newEvent = new Event({ ...req.body, creator: req.session.user.id });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Подію не знайдено' });
        if (event.creator.toString() !== req.session.user.id) {
            return res.status(403).json({ error: 'Можна редагувати лише свої події' });
        }
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Подію не знайдено' });
        if (event.creator.toString() !== req.session.user.id && req.session.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Доступ заборонено' });
        }
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Подію успішно видалено' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/participants', isAuthenticated, async (req, res) => {
    try {
        const newParticipant = new Participant(req.body);
        await newParticipant.save();
        res.status(201).json(newParticipant);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/analytics/registrations', isAuthenticated, async (req, res) => {
    try {
        const participants = await Participant.find();
        res.json(participants);
    } catch (error) { res.status(500).json({ error: 'Помилка отримання аналітики' }); }
});

const typeDefs = `#graphql
  type User { id: ID!, email: String!, role: String! }
  type Participant { id: ID!, name: String!, email: String!, eventId: ID! }
  
  type Event { 
    id: ID!, title: String!, description: String, date: String!, organizer: String, 
    creator: User, 
    participants: [Participant] 
  }
  
  input AddEventInput { title: String!, description: String, date: String!, organizer: String }

  type Query {
    getEvents(limit: Int = 10, cursor: ID): [Event]
  }

  type Mutation {
    addEvent(input: AddEventInput!): Event
  }
`;

const resolvers = {
  Query: {
    getEvents: async (_, { limit, cursor }) => {
      const query = cursor ? { _id: { $gt: cursor } } : {};
      return await Event.find(query).limit(limit);
    }
  },
  Mutation: {
    addEvent: async (_, { input }, context) => {
      if (!context.user) throw new Error('Неавторизовано! Увійдіть у систему.');
      if (input.title.length < 3) throw new Error('Назва події занадто коротка');

      const event = new Event({ ...input, creator: context.user.id });
      await event.save();
      return event;
    }
  },
  Event: {
    creator: async (parent) => await User.findById(parent.creator),
    participants: async (parent) => await Participant.find({ eventId: parent._id })
  }
};

const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => ({ user: req.session.user })
}));


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
    console.log('Користувач підключився до чату');
    
    socket.on('chat_message', (msg) => {
        io.emit('chat_message', msg); 
    });

    socket.on('disconnect', () => console.log('Користувач відключився'));
});

httpServer.listen(PORT, () => {
    console.log(`Сервер та WebSockets запущено: http://localhost:${PORT}`);
    console.log(`GraphQL доступний за адресою: http://localhost:${PORT}/graphql`);
});