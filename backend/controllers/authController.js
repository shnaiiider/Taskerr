import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import userModel from '../models/userModel.js'

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET)

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'All fields are required' })
        }

        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: 'Email already registered' })
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await userModel.create({ name, email, password: hashed })
        const token = generateToken(user._id)

        res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email } })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.json({ success: false, message: 'All fields are required' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: 'Wrong password' })
        }

        const token = generateToken(user._id)
        res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email } })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('-password')
        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { register, login, getMe }
