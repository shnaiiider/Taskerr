import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import { AppContext } from '../context/AppContext.jsx'
import DAGVisualizer from '../components/DAGVisualizer.jsx'
import TaskModal from '../components/TaskModal.jsx'

const Y = '#d4f100'
const socket = io('http://localhost:5000', { autoConnect: false })

export default function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { backendUrl, token, user, projects } = useContext(AppContext)

  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('Tasks')
  const [filter, setFilter] = useState('all')
  const [taskModal, setTaskModal] = useState(null)  // null | 'new' | task object
  const [graphData, setGraphData] = useState(null)
  const [execOrder, setExecOrder] = useState([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberMsg, setMemberMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // find project from context
  const project = projects.find(p => p._id === id)

  useEffect(() => {
    if (!token) { navigate('/login'); return }

    // load tasks
    axios.get(backendUrl + '/api/tasks/' + id, { headers: { token } })
      .then(res => { if (res.data.success) setTasks(res.data.tasks) })
      .finally(() => setLoading(false))

    // join websocket room
    socket.connect()
    socket.emit('join_project', id)
    socket.on('task_updated', ({ action, task }) => {
      if (action === 'create') setTasks(prev => [task, ...prev])
      if (action === 'update') setTasks(prev => prev.map(t => t._id === task._id ? task : t))
      if (action === 'delete') setTasks(prev => prev.filter(t => t._id !== task._id))
    })

    return () => { socket.off('task_updated'); socket.disconnect() }
  }, [id, token])

  const switchTab = (newTab) => {
    setTab(newTab)
    if (newTab === 'Graph') {
      axios.get(backendUrl + '/api/tasks/' + id + '/graph', { headers: { token } })
        .then(res => { if (res.data.success) setGraphData(res.data) })
    }
    if (newTab === 'Execution Order') {
      axios.get(backendUrl + '/api/tasks/' + id + '/order', { headers: { token } })
        .then(res => { if (res.data.success) setExecOrder(res.data.order) })
    }
  }

  const handleCreate = async (form) => {
    const res = await axios.post(backendUrl + '/api/tasks/' + id, form, { headers: { token } })
    if (!res.data.success) throw new Error(res.data.message)
    setTasks(prev => [res.data.task, ...prev])
    socket.emit('task_update', { projectId: id, action: 'create', task: res.data.task })
  }

  const handleUpdate = async (form) => {
    const res = await axios.put(backendUrl + '/api/tasks/' + id + '/' + taskModal._id, form, { headers: { token } })
    if (!res.data.success) throw new Error(res.data.message)
    setTasks(prev => prev.map(t => t._id === taskModal._id ? res.data.task : t))
    socket.emit('task_update', { projectId: id, action: 'update', task: res.data.task })
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    await axios.delete(backendUrl + '/api/tasks/' + id + '/' + taskId, { headers: { token } })
    setTasks(prev => prev.filter(t => t._id !== taskId))
    socket.emit('task_update', { projectId: id, action: 'delete', task: { _id: taskId } })
  }

  const cycleStatus = async (task) => {
    const next = { pending: 'in_progress', in_progress: 'completed', completed: 'pending', blocked: 'pending' }
    const res = await axios.put(backendUrl + '/api/tasks/' + id + '/' + task._id, { status: next[task.status] }, { headers: { token } })
    if (res.data.success) setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t))
  }

  const addMember = async (e) => {
    e.preventDefault()
    const res = await axios.post(backendUrl + '/api/projects/' + id + '/members', { email: memberEmail }, { headers: { token } })
    setMemberMsg(res.data.message)
    setMemberEmail('')
  }

  // badge colours
  const statusColor = { pending: '#555', in_progress: '#3b82f6', completed: '#10b981', blocked: '#ef4444' }
  const priorityColor = { low: '#555', medium: '#f59e0b', high: '#ef4444' }

  const Badge = ({ val, type }) => (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: (type === 'status' ? statusColor : priorityColor)[val] + '22', color: (type === 'status' ? statusColor : priorityColor)[val], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {val.replace('_', ' ')}
    </span>
  )

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>

      {/* header */}
      <div style={{ padding: '14px 28px 0', borderBottom: '1px solid #1a1a1a', background: '#111', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#666', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>←</button>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: project?.color || Y }} />
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{project?.name || 'Project'}</h1>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#666', background: '#1a1a1a', padding: '2px 9px', borderRadius: 20 }}>
              {project?.members?.length || 0} members
            </span>
          </div>
          <button onClick={() => setTaskModal('new')} style={{ padding: '8px 16px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add Task
          </button>
        </div>

        {/* stats */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
          {[['Total', stats.total, '#fff'], ['In Progress', stats.inProgress, '#3b82f6'], ['Done', stats.completed, '#10b981'], ['Blocked', stats.blocked, '#ef4444']].map(([label, value, color]) => (
            <div key={label}>
              <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{value}</span>
              <span style={{ fontSize: 11, color: '#555', marginLeft: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div style={{ display: 'flex' }}>
          {['Tasks', 'Graph', 'Execution Order', 'Members'].map(t => (
            <button key={t} onClick={() => switchTab(t)}
              style={{ padding: '9px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: '2px solid ' + (tab === t ? Y : 'transparent'), background: 'none', color: tab === t ? Y : '#555', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

        {/* ── TASKS ── */}
        {tab === 'Tasks' && (
          <div>
            {/* filter pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'pending', 'in_progress', 'completed', 'blocked'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: '1px solid ' + (filter === f ? Y : '#222'), background: filter === f ? Y : 'transparent', color: filter === f ? '#000' : '#555' }}>
                  {f === 'all' ? 'All (' + tasks.length + ')' : f.replace('_', ' ')}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                {filter === 'all' ? 'No tasks yet — click Add Task' : 'No ' + filter + ' tasks'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(task => {
                  const depNames = (task.dependencies || [])
                    .map(depId => tasks.find(t => t._id === (depId._id || depId))?.title)
                    .filter(Boolean)

                  return (
                    <div key={task._id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                      {/* click circle to cycle status */}
                      <button onClick={() => cycleStatus(task)} title="Click to cycle status"
                        style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (task.status === 'completed' ? '#10b981' : '#333'), background: task.status === 'completed' ? '#10b981' : 'transparent', flexShrink: 0, marginTop: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {task.status === 'completed' && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? '#555' : '#fff' }}>
                            {task.title}
                          </span>
                          <Badge val={task.status} type="status" />
                          <Badge val={task.priority} type="priority" />
                        </div>
                        {task.description && <p style={{ fontSize: 12, color: '#555', fontFamily: 'JetBrains Mono', lineHeight: 1.5, marginBottom: 4 }}>{task.description}</p>}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono' }}>
                          {depNames.length > 0 && <span>↳ needs: {depNames.join(', ')}</span>}
                          {task.dueDate && <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'completed' ? '#ef4444' : '#555' }}>due {task.dueDate}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setTaskModal(task)} style={{ background: 'none', border: '1px solid #222', borderRadius: 6, color: '#666', padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>edit</button>
                        <button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: '1px solid #330000', borderRadius: 6, color: '#ef4444', padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>del</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GRAPH ── */}
        {tab === 'Graph' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Dependency Graph</h2>
                <p style={{ fontSize: 12, color: '#555', fontFamily: 'JetBrains Mono', marginTop: 4 }}>Drag nodes · arrows show direction · yellow #n = run order</p>
              </div>
              <button onClick={() => switchTab('Graph')} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 12 }}>Refresh</button>
            </div>
            {graphData
              ? <DAGVisualizer nodes={graphData.nodes} edges={graphData.edges} order={graphData.order} />
              : <div style={{ textAlign: 'center', padding: 40, color: '#444', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Loading...</div>
            }
          </div>
        )}

        {/* ── EXECUTION ORDER ── */}
        {tab === 'Execution Order' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Topological Execution Order</h2>
            <p style={{ fontSize: 12, color: '#555', fontFamily: 'JetBrains Mono', marginBottom: 16 }}>Kahn's BFS — dependencies always run before the tasks that need them</p>
            {execOrder.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: '#444', fontFamily: 'JetBrains Mono', fontSize: 13 }}>No tasks yet</div>
              : execOrder.map((task, i) => {
                const depNames = (task.dependencies || [])
                  .map(depId => execOrder.find(t => t._id === (depId._id || depId))?.title || tasks.find(t => t._id === (depId._id || depId))?.title)
                  .filter(Boolean)
                return (
                  <div key={task._id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(212,241,0,0.1)', border: '1px solid ' + Y, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: Y, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                      {depNames.length > 0 && <div style={{ fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono', marginTop: 3 }}>needs: {depNames.join(', ')}</div>}
                    </div>
                    <Badge val={task.status} type="status" />
                    <Badge val={task.priority} type="priority" />
                  </div>
                )
              })
            }
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'Members' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Project Members</h2>
            <p style={{ fontSize: 12, color: '#555', fontFamily: 'JetBrains Mono', marginBottom: 20 }}>Add members by email. They see this project in their dashboard.</p>

            {(project?.members || []).map((member, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(212,241,0,0.1)', border: '1px solid ' + Y, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: Y, flexShrink: 0 }}>
                  {member.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</div>
                  <div style={{ fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono' }}>{member.email}</div>
                </div>
                {project?.owner?._id === member._id && (
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', background: 'rgba(212,241,0,0.1)', color: Y, padding: '2px 8px', borderRadius: 20 }}>owner</span>
                )}
              </div>
            ))}

            <form onSubmit={addMember} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} type="email" placeholder="member@email.com"
                style={{ flex: 1, padding: '9px 13px', background: '#111', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }} />
              <button type="submit" style={{ padding: '9px 16px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Add</button>
            </form>
            {memberMsg && <p style={{ fontSize: 12, color: '#666', fontFamily: 'JetBrains Mono', marginTop: 8 }}>{memberMsg}</p>}
          </div>
        )}
      </div>

      {/* task modal */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          tasks={tasks}
          onSave={taskModal === 'new' ? handleCreate : handleUpdate}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  )
}
