import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../context/AppContext.jsx'

const Y = '#d4f100'
const COLORS = ['#d4f100', '#10b981', '#3b82f6', '#a78bfa', '#f97316', '#ef4444']

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { backendUrl, token, setToken, user, projects, setProjects, loadProjects } = useContext(AppContext)

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')

  // redirect to login if no token
  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name required'); return }

    const { data } = await axios.post(backendUrl + '/api/projects', { name, description, color }, { headers: { token } })

    if (data.success) {
      setProjects([data.project, ...projects])
      setShowModal(false)
      setName(''); setDescription(''); setColor(COLORS[0]); setError('')
    } else {
      setError(data.message)
    }
  }

  const handleDelete = async (e, projectId) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return
    await axios.delete(backendUrl + '/api/projects/' + projectId, { headers: { token } })
    setProjects(projects.filter(p => p._id !== projectId))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    navigate('/login')
  }

  const inp = { width: '100%', padding: '10px 14px', background: '#111', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }
  const label = { fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid #1a1a1a', background: '#111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: Y, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 3h11M1 7h7M1 11h5" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>TaskFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#666' }}>Hey, {user?.name}</span>
          <button onClick={logout} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#888', fontSize: 13, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* main */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Projects</h1>
            <p style={{ color: '#666', fontSize: 13, marginTop: 4, fontFamily: 'JetBrains Mono' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 18px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#444', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
            No projects yet — create your first one
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {projects.map(project => (
              <div key={project._id}
                onClick={() => navigate('/project/' + project._id)}
                style={{ background: '#111', border: '1px solid #1e1e1e', borderLeft: '3px solid ' + project.color, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
                  <button onClick={e => handleDelete(e, project._id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
                </div>
                {project.description && <p style={{ fontSize: 12, color: '#666', fontFamily: 'JetBrains Mono', lineHeight: 1.5, marginBottom: 8 }}>{project.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444', fontFamily: 'JetBrains Mono', marginTop: 8 }}>
                  <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                  <span>{project.owner?.name === user?.name ? 'owner' : 'member'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* create modal */}
      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '28px 24px', width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>New Project</h2>
            {error && <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#ff5555', marginBottom: 14, fontFamily: 'JetBrains Mono' }}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={label}>Project Name</span>
                <input style={inp} placeholder="e.g. E-Commerce App" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <span style={label}>Description</span>
                <textarea style={{ ...inp, resize: 'vertical' }} rows={2} placeholder="What is this about?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <span style={label}>Color</span> 
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setColor(c)}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid white' : '2px solid transparent', transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: Y, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
