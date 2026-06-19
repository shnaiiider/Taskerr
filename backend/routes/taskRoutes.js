import express from 'express'
import { getTasks, createTask, updateTask, deleteTask, getGraphData, getExecutionOrder } from '../controllers/taskController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/:projectId', authMiddleware, getTasks)
router.post('/:projectId', authMiddleware, createTask)
router.put('/:projectId/:taskId', authMiddleware, updateTask)
router.delete('/:projectId/:taskId', authMiddleware, deleteTask)
router.get('/:projectId/graph', authMiddleware, getGraphData)
router.get('/:projectId/order', authMiddleware, getExecutionOrder)

export default router
