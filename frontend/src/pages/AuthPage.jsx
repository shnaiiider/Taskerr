import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../context/AppContext.jsx'

const Y = '#d4f100'  // neon yellow

const cards = [
  {
    num: '1', title: 'Tasks form a graph',
    desc: 'Each task is a node. Each dependency is a directed edge — forming a DAG. The challenge: find an order where every dependency runs before the task that needs it.',
    code:`{
    Tasks
    }`
  },
  {
    num: '2', title: "Kahn's Topological Sort",
    desc: 'Count incoming edges per task. Tasks with 0 go first. As tasks complete, reduce neighbor counts. Add newly-zero nodes to the queue. O(V+E) time.',
    code: `function topoSort(tasks) {
  tasks.forEach(t => t.deps.forEach(dep => {
    inDegree[t.id]++  // count incoming edges
  }))
  // tasks with no deps go first
  const queue = tasks.filter(t => inDegree[t] === 0)
  while (queue.length) {
    const task = queue.shift()
    order.push(task)
    neighbors.forEach(n => {
      if (--inDegree[n] === 0) queue.push(n)
    })
  }
}`
  },
  {
    num: '3', title: 'Cycle Detection',
    desc: 'If final order length < total nodes, some tasks are in a loop (A→B→C→A = impossible). We check this before every save.',
    code: `const { order, hasCycle } = topoSort(tasks)
if (hasCycle) {
  return res.send({ success: false,
    message: 'Circular dependency!'
  })
}`
  },
  {
    num: '4', title: 'Real-time with WebSockets',
    desc: 'Every project is a Socket.IO room. Task changes broadcast to all members live.',
    code: `socket.emit('join_project', projectId)
socket.on('task_updated', ({ action, task }) => {
  if (action === 'create') addTask(task)
  if (action === 'update') replaceTask(task)
  if (action === 'delete') removeTask(task)
})`
  },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const { backendUrl, setToken, setUser } = useContext(AppContext)

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data
      if (mode === 'login') {
        const res = await axios.post(backendUrl + '/api/auth/login', { email, password })
        data = res.data
      } else {
        const res = await axios.post(backendUrl + '/api/auth/register', { name, email, password })
        data = res.data
      }

      if (!data.success) {
        setError(data.message)
        setLoading(false)
        return
      }

      // save token and user in context + localStorage
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      navigate('/')

    } catch (err) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  // reusable input style
  const inp = {
    width: '100%', padding: '10px 14px',
    background: '#111', border: '1px solid #222',
    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>


      {/* ── hero: branding + form ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 64, padding: '72px 32px 48px' }}>

        {/* left: text */}
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: Y, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800 }}>TaskFlow</span>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Schedule tasks by<br/>
            <span style={{ color: Y }}>dependency order</span>
          </h1>

          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, fontFamily: 'JetBrains Mono' }}>
            Applies Kahn's BFS topological sort to compute valid task execution order.
            Cycle detection blocks impossible dependencies.
            Real-time collaboration via WebSockets.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {['MongoDB', 'Express', 'React', 'Node.js', 'Socket.IO', 'D3.js', "Kahn's BFS"].map(t => (
              <span key={t} style={{ fontSize: 11, fontFamily: 'JetBrains Mono', background: '#111', border: '1px solid #222', borderRadius: 6, padding: '3px 10px', color: '#666' }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* right: form */}
        <div style={{ width: '100%', maxWidth: 340, background: '#111', border: '1px solid #222', borderRadius: 12, padding: '28px 24px' }}>

          {/* toggle */}
          <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 8, padding: 3, marginBottom: 22 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', background: mode === m ? '#222' : 'transparent', color: mode === m ? '#fff' : '#666' }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Name</div>
                <input style={inp} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</div>
              <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Password</div>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && (
              <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#ff5555', fontFamily: 'JetBrains Mono' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop: 4, padding: '11px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>

      {/* ── how it works ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 48, marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: Y, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Engineering</div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>How It <span style={{ color: Y }}>Actually</span> Works</h2>
          <p style={{ color: '#666', fontSize: 14, marginTop: 10, fontFamily: 'JetBrains Mono' }}>No black box. Here's exactly what happens.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
          {cards.map(card => (
            <div key={card.num} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, background: Y, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#000', flexShrink: 0 }}>
                  {card.num}
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{card.title}</span>
              </div>
              <p style={{ color: '#666', fontSize: 13, lineHeight: 1.7, marginBottom: card.code ? 12 : 0 }}>{card.desc}</p>
              {card.code && (
                <pre style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 14px', fontSize: 11, fontFamily: 'JetBrains Mono', color: '#888', lineHeight: 1.7, overflowX: 'auto' }}>
                  {card.code}
                </pre>
              )}
            </div>
          ))}
        </div>

        {/* tech stack */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '20px 22px', marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Tech Stack</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              ['Node.js + Express', 'REST API'],
              ['MongoDB + Mongoose', 'No SQL Data Storage'],
              ['Socket.IO', 'Real-time rooms'],
              ['React + Vite', 'Clean Frontend UI'],
              ['D3.js', 'Force-directed DAG'],
              ['JWT', 'Authentication'],
              ["Kahn's Algorithm", 'O(V+E) topo sort'],
              ['Cycle Detection', 'Blocks bad dependencies'],
            ].map(([tech, desc]) => (
              <div key={tech} style={{ background: '#0a0a0a', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: Y, fontFamily: 'JetBrains Mono', marginBottom: 3 }}>{tech}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
