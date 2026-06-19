import projectModel from '../models/projectModel.js'
import taskModel from '../models/taskModel.js'

// GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projects = await projectModel.find({ owner: req.userId }).sort({ createdAt: -1 })
        res.json({ success: true, projects })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, color } = req.body
        if (!name) return res.json({ success: false, message: 'Project name is required' })

        const project = await projectModel.create({ name, description, color, owner: req.userId })
        res.json({ success: true, project })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await projectModel.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            req.body,
            { new: true }
        )
        if (!project) return res.json({ success: false, message: 'Project not found' })
        res.json({ success: true, project })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await projectModel.findOneAndDelete({ _id: req.params.id, owner: req.userId })
        if (!project) return res.json({ success: false, message: 'Project not found' })
        await taskModel.deleteMany({ project: req.params.id })
        res.json({ success: true, message: 'Project deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { getProjects, createProject, updateProject, deleteProject }
