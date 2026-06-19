import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    const { token } = req.headers
    if (!token) {
        return res.json({ success: false, message: 'Not authorized. Please login.' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.id
        next()
    } catch (error) {
        return res.json({ success: false, message: 'Invalid token. Please login again.' })
    }
}

export default authMiddleware
