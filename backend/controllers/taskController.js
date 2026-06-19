import taskModel from '../models/taskModel.js'
import { topoSort, getBlockedTasks } from '../services/topoSort.js'

// GET /api/tasks/:projectId
const getTasks = async (req, res) => {
    try {
        const tasks = await taskModel.find({ project: req.params.projectId })
        res.json({ success: true, tasks })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// POST /api/tasks/:projectId
const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dependencies, dueDate } = req.body
        if (!title) return res.json({ success: false, message: 'Title is required' })

        // cycle check before saving
        if (dependencies && dependencies.length > 0) {
            const existing = await taskModel.find({ project: req.params.projectId })
            const temp = [...existing, { _id: 'new_temp', dependencies }]
            if (topoSort(temp).hasCycle) {
                return res.json({ success: false, message: 'Circular dependency detected' })
            }
        }

        const task = await taskModel.create({
            title, description, status, priority,
            dependencies: dependencies || [],
            dueDate: dueDate || '',
            project: req.params.projectId
        })

        res.json({ success: true, task })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// PUT /api/tasks/:projectId/:taskId
const updateTask = async (req, res) => {
    try {
        const { dependencies } = req.body

        // re-run cycle check if deps changed
        if (dependencies !== undefined) {
            const allTasks = await taskModel.find({ project: req.params.projectId })
            const simulated = allTasks.map(t =>
                t._id.toString() === req.params.taskId
                    ? { _id: t._id, dependencies }
                    : t
            )
            if (topoSort(simulated).hasCycle) {
                return res.json({ success: false, message: 'Circular dependency detected' })
            }
        }

        const task = await taskModel.findByIdAndUpdate(req.params.taskId, req.body, { new: true })
        if (!task) return res.json({ success: false, message: 'Task not found' })
        res.json({ success: true, task })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// DELETE /api/tasks/:projectId/:taskId
const deleteTask = async (req, res) => {
    try {
        await taskModel.findByIdAndDelete(req.params.taskId)
        // remove from other tasks' dependencies
        await taskModel.updateMany(
            { project: req.params.projectId },
            { $pull: { dependencies: req.params.taskId } }
        )
        res.json({ success: true, message: 'Task deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// GET /api/tasks/:projectId/graph
const getGraphData = async (req, res) => {
    try {
        const tasks = await taskModel.find({ project: req.params.projectId })
        const { order, hasCycle } = topoSort(tasks)

        const nodes = tasks.map(t => ({
            id: t._id.toString(),
            title: t.title,
            status: t.status,
            priority: t.priority,
        }))

        const edges = []
        tasks.forEach(t => {
            t.dependencies.forEach(dep => {
                edges.push({ source: dep.toString(), target: t._id.toString() })
            })
        })

        res.json({ success: true, nodes, edges, order, hasCycle })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// GET /api/tasks/:projectId/order
const getExecutionOrder = async (req, res) => {
    try {
        const tasks = await taskModel.find({ project: req.params.projectId })
        const { order, hasCycle } = topoSort(tasks)
        if (hasCycle) return res.json({ success: false, message: 'Cycle detected in task graph' })

        const taskMap = {}
        tasks.forEach(t => { taskMap[t._id.toString()] = t })
        const ordered = order.map(id => taskMap[id]).filter(Boolean)
        res.json({ success: true, order: ordered })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { getTasks, createTask, updateTask, deleteTask, getGraphData, getExecutionOrder }
