import { createContext, useEffect, useState } from 'react'
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const backendUrl ='https://taskflow-v3-fixed.onrender.com'

    const [token, setToken] = useState(localStorage.getItem('token') || '')
    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])

    // load user profile when token is available
    const loadUser = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/auth/me', { headers: { token } })
            if (data.success) {
                setUser(data.user)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // load all projects
    const loadProjects = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/projects', { headers: { token } })
            if (data.success) {
                setProjects(data.projects)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (token) {
            loadUser()
            loadProjects()
        }
    }, [token])

    const value = {
        backendUrl,
        token, setToken,
        user, setUser,
        projects, setProjects, loadProjects
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
