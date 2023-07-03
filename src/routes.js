const express = require('express')
const router = express.Router()

const {
  register,
  login,
  forgetPassword,
  logout,
  addUserData,
  editPassword,
  verifyEmail,
  getUserData,
  editUserData,
  addCalorieLog,
  getDailyCalorieLog,
  getMonthlyCalorieLog,
  // getAllFoodsData,
  getFoodData,
  updateUserAssessment
} = require('./auth')

router.post('/register', register)

router.post('/verifyemail', verifyEmail)

router.post('/login', login)

router.post('/forget-password', forgetPassword)

router.post('/logout', logout)

router.post('/edit-password', editPassword)

router.post('/user-data', addUserData)

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
router.put('/user-data/:userId', upload.single('image'), editUserData)

router.put('/update-user-assessment/:userId', updateUserAssessment)

router.get('/user-data/:userId', getUserData)

router.post('/calorielog/:userId', addCalorieLog)

router.get('/daily-calorielog/:userId/:date-:month-:year', getDailyCalorieLog)

router.get('/monthly-calorielog/:userId/:month-:year', getMonthlyCalorieLog)

// router.get('/foods', getAllFoodsData)

router.get('/foods/:foodName', getFoodData)

module.exports = router
