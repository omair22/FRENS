import './instrument.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import hangoutRoutes from './routes/hangouts.js'
import frenRoutes from './routes/frens.js'
import availabilityRoutes from './routes/availability.js'
import aiRoutes from './routes/ai.js'
import usersRoutes from './routes/users.js'
import nearbyRoutes from './routes/nearby.js'
import notificationsRoutes from './routes/notifications.js'
import venuesRoutes from './routes/venues.js'
import inviteRoutes from './routes/invite.js'
import ogRoutes from './routes/og.js'
import { archivePassedHangouts } from './lib/archiveHangouts.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Enable CORS for frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://frens-app.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.endsWith('.vercel.app') ||
                     origin.includes('localhost:');
                     
    if (isAllowed) {
      callback(null, true);
    } else {
      // Be permissive in case of subdomains or other local dev variants
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}))

app.use(express.json())

// Mount routes
app.get('/api/test', (req, res) => res.json({ message: 'API is working' }))
app.use('/api/invite', inviteRoutes)
app.use('/api/og', ogRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/hangouts', hangoutRoutes)
app.use('/api/frens', frenRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/nearby', nearbyRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/venues', venuesRoutes)

// The Sentry error handler must be registered before any other error middleware and after all controllers
import * as Sentry from "@sentry/node";
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'frens-backend' })
})

app.listen(PORT, () => {
  console.log(`Frens backend running on port ${PORT}`)

  // Run on startup to catch anything missed while server was down
  archivePassedHangouts().then(archived => {
    if (archived && archived.length > 0) {
      console.log(`[STARTUP] Archived ${archived.length} past hangout(s)`)
    }
  }).catch(err => {
    console.error('[STARTUP ARCHIVE ERROR]', err)
  })
})
