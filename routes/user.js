import {Router}  from "express";
import bcrypt from 'bcrypt'
const router = Router()
import {User} from '../models/User.js'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

router.post('/signup', async (req, res) => {
   const {username, email, password} = req.body
   const user = await User.findOne({email})
   if(user){
      return res.json({status: true, message: "user already existed"})
   }

   const hashpassword = await bcrypt.hash(password, 10)
   const newUser = new User({
      username,
      email,
      password: hashpassword,
   })

   await newUser.save()
   return res.json({message: "record registed"})
})

router.post('/login', async (req, res) => {
   const {email, password} = req.body
   const user = await User.findOne({email})
   if(!user) {
      return res.json({message: "user is not registered"})
   }

   const validPassword = await bcrypt.compare(password, user.password)
   if(!validPassword) {
      return res.json({message: 'password is incorrect'})
   }

   const token = jwt.sign({username: user.username}, process.env.KEY, {expiresIn: '23h'})
   res.cookie('token', token, {httpOnly: true, maxAge: 360000}) 
   return res.json({status: true, message: "login successfully"})
})

router.post('/forgot-password', async (req, res) => {
   const {email} = req.body
   try {
      const user = await User.findOne({email})
      if(!user) {
         return res.json({message: 'user not registered'})
      }
      const token = jwt.sign({id: user._id}, process.env.KEY, {expiresIn: '5m'})

      var transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: 'youremail@gmail.com',
            pass: 'yourpassword'
         }
      });

      var mailOprions = {
         from: 'youremail@gmail.com',
         to: email,
         subject: 'Sending Email using Node.js',
         text: `http://locaclhost:5173/resetPassword/${token}`
      }

      transporter.sendMail(mailOprions, function(error, info){
         if(error){
            return res.json({message: 'error sending message'})
         } else {
            return res.json({status: true, message: 'email sent'})
         }
      })

   } catch (err) {
      console.log(err)
   }
})

router.post('/reset-password', async (req, res) => {
   const {token} = req.params
   const {password} = req.body

   try {
      const decoded = await jwt.verify(token, process.env.KEY)
      const id = decoded.id
      const hashPassword = await bcrypt.hash(password, 10)
      await User.findByIdAndUpdate({_id: id}, {password: hashPassword})
   } catch (error) {
      return res.json('invalid token')
   }
})

const verifyUser = async (req, res, next) => {
   try {
      const token = req.cookies.token
      if(!token) {
         return res.json({status: false, message: 'no token'})
      }
      const decoded = await jwt.verify(token, process.env.KEY)
      next()
      
   } catch (err) {
      return res.json(err)
   }
}


router.get('/verify', verifyUser, async (req, res) => {
   const token = req.cookies.token
   const decoded = await jwt.verify(token, process.env.KEY)
   const user = await User.findOne({username: decoded.username})
   return res.json({status: true, message: "authorized", data: user})
})

router.get('/logout', (req, res) => {
   res.clearCookie('token')
   return res.json({status: true})
})


export {router as UserRouter}