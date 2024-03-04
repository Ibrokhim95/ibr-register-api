import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
dotenv.config()
import { UserRouter } from './routes/user.js'

const app = express()
app.use(express.json())
app.use(cors({
   origin: ["http://localhost:5173", "https://ibr-register.onrender.com"],
   credentials: true
}))
app.use(cookieParser())
app.use('/auth', UserRouter)

app.get('/', (req, res) => {
   res.send("Backend connected")
})

const PORT = process.env.PORT || 3000

mongoose.connect(process.env.MONGO_URI)

app.listen(PORT, () => console.log("Server is running"))