import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
}, { timestamps: true })

const projectModel = mongoose.models.project || mongoose.model('project', projectSchema)
export default projectModel
