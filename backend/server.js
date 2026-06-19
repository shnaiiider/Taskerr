import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: '*' }
})

const PORT = process.env.PORT || 5000

connectDB()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)

app.get('/', (req, res) => res.send('TaskFlow API running'))

// WebSocket — real-time collaboration
// Each project gets its own room
io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // join a project room
    socket.on('join_project', (projectId) => {
        socket.join(projectId)
        console.log(`Socket ${socket.id} joined project ${projectId}`)
    })

    // when a task is created/updated/deleted, broadcast to room
    socket.on('task_update', ({ projectId, action, task }) => {
        socket.to(projectId).emit('task_updated', { action, task })
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

// make io accessible in controllers if needed
app.set('io', io)

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
