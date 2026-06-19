import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.token = token
  return config
})

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
}

export const projectAPI = {
  getAll:   ()           => api.get('/projects'),
  create:   (data)       => api.post('/projects', data),
  update:   (id, data)   => api.put('/projects/' + id, data),
  delete:   (id)         => api.delete('/projects/' + id),
  addMember:(id, email)  => api.post('/projects/' + id + '/members', { email }),
}

export const taskAPI = {
  getAll:   (pid)         => api.get('/tasks/' + pid),
  create:   (pid, data)   => api.post('/tasks/' + pid, data),
  update:   (pid, tid, data) => api.put('/tasks/' + pid + '/' + tid, data),
  delete:   (pid, tid)    => api.delete('/tasks/' + pid + '/' + tid),
  getGraph: (pid)         => api.get('/tasks/' + pid + '/graph'),
  getOrder: (pid)         => api.get('/tasks/' + pid + '/order'),
}
