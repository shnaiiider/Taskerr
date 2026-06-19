import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'blocked'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }], // adjacency list
    dueDate: { type: String, default: '' },
}, { timestamps: true })

const taskModel = mongoose.models.task || mongoose.model('task', taskSchema)
export default taskModel
