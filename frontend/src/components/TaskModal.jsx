import { useState } from 'react'

const Y = '#d4f100'

export default function TaskModal({ task, tasks, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState(task?.status || 'pending')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  const [dependencies, setDependencies] = useState(
    task?.dependencies?.map(d => d._id || d) || []
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // toggle a dependency on/off
  const toggleDep = (id) => {
    if (dependencies.includes(id)) {
      setDependencies(dependencies.filter(d => d !== id))
    } else {
      setDependencies([...dependencies, id])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({ title, description, status, priority, dueDate, dependencies })
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '9px 13px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }

  // all tasks except the one being edited
  const availableTasks = tasks.filter(t => (t._id || t) !== task?._id)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '24px', width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#ff5555', marginBottom: 14, fontFamily: 'JetBrains Mono' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={lbl}>Title</span>
            <input style={inp} placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>

          <div>
            <span style={lbl}>Description</span>
            <textarea style={{ ...inp, resize: 'vertical' }} rows={2} placeholder="Optional details..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={lbl}>Status</span>
              <select style={inp} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <span style={lbl}>Priority</span>
              <select style={inp} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <span style={lbl}>Due Date</span>
            <input style={inp} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          {availableTasks.length > 0 && (
            <div>
              <span style={lbl}>Dependencies — must complete before this task</span>
              <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                {availableTasks.map(t => {
                  const tid = t._id || t
                  const isChecked = dependencies.includes(tid)
                  return (
                    <div key={tid} onClick={() => toggleDep(tid)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid ' + (isChecked ? Y : '#222'), background: isChecked ? 'rgba(212,241,0,0.07)' : '#0a0a0a', cursor: 'pointer' }}>
                      {/* checkbox */}
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid ' + (isChecked ? Y : '#444'), background: isChecked ? Y : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isChecked && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#1a1a1a', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 18px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
