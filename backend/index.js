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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Enable CORS for frontend (standard local vite port or env)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}))

app.use(express.json())

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/hangouts', hangoutRoutes)
app.use('/api/frens', frenRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/nearby', nearbyRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'frens-backend' })
})

app.listen(PORT, () => {
  console.log(`Frens backend running on port ${PORT}`)
})
