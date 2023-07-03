/* eslint-disable no-case-declarations */
const firebase = require('../config/firebase.js')
const admin = require('../config/firebase-admin.js')
const moment = require('moment')
require('moment-timezone')
const db = firebase.firestore()

// register
exports.register = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(422).json({
      error: true,
      message: 'Email and password is required'
    })
  }

  if (req.body.passwordConfirmation !== req.body.password) {
    return res.status(400).json({
      error: true,
      message: 'Password didnt match'
    })
  }

  firebase
    .auth()
    .createUserWithEmailAndPassword(req.body.email, req.body.password)
    .then((data) => {
      return res.status(201).json({
        error: false,
        message: 'User created',
        data
      })
    })
    .catch(function (error) {
      const errorCode = error.code
      const errorMessage = error.message
      if (errorCode === 'auth/weak-password') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      } else {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      }
    })
}

// login
exports.login = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(422).json({
      error: true,
      message: 'Email and password is required'
    })
  }
  firebase
    .auth()
    .signInWithEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {
      return res.status(200).json({
        error: false,
        message: 'User logged in',
        user
      })
    })
    .catch(function (error) {
      const errorCode = error.code
      const errorMessage = error.message
      if (errorCode === 'auth/weak-password') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      } else {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      }
    })
}

// logout
exports.logout = (req, res) => {
  const user = firebase.auth().currentUser

  if (user) {
    firebase
      .auth()
      .signOut()
      .then((user) => {
        return res.status(200).json({
          error: false,
          message: 'Logout Successfully!',
          user
        })
      })
      .catch(function (error) {
        const errorCode = error.code
        const errorMessage = error.message
        if (errorCode === 'auth/too-many-requests') {
          return res.status(500).json({
            error: true,
            message: errorMessage
          })
        }
      })
  } else {
    return res.status(500).json({
      error: true,
      message: 'User not found!'
    })
  }
}

// verify email
// this work after signup & signin
exports.verifyEmail = (req, res) => {
  firebase
    .auth()
    .currentUser.sendEmailVerification()
    .then(function () {
      return res.status(200).json({
        error: false,
        message: 'Email verification has been sent!'
      })
    })
    .catch(function (error) {
      const errorCode = error.code
      const errorMessage = error.message
      if (errorCode === 'auth/too-many-requests') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      }
    })
}

// forget password
exports.forgetPassword = (req, res) => {
  if (!req.body.email) {
    return res.status(422).json({
      error: true,
      message: 'Email is required'
    })
  }
  firebase
    .auth()
    .sendPasswordResetEmail(req.body.email)
    .then(function () {
      return res.status(200).json({
        error: false,
        message: 'Password reset email has been sent!'
      })
    })
    .catch(function (error) {
      const errorCode = error.code
      const errorMessage = error.message
      if (errorCode === 'auth/invalid-email') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      } else if (errorCode === 'auth/user-not-found') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      }
    })
}

// edit password
exports.editPassword = (req, res) => {
  const user = firebase.auth().currentUser

  if (!user) {
    return res.status(401).json({
      error: true,
      message: 'User not authenticated'
    })
  }

  if (!req.body.password) {
    return res.status(422).json({
      error: true,
      message: 'Password is required'
    })
  }

  if (req.body.passwordConfirmation !== req.body.password) {
    return res.status(400).json({
      error: true,
      message: 'Passwords do not match'
    })
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, req.body.currentPassword)
    .then((userCredential) => {
      const user = userCredential.user
      return user.updatePassword(req.body.password)
    })
    .then(() => {
      return res.status(200).json({
        error: false,
        message: 'Password updated successfully!'
      })
    })
    .catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message
      if (errorCode === 'auth/user-not-found') {
        return res.status(404).json({
          error: true,
          message: 'User not found'
        })
      } else if (errorCode === 'auth/wrong-password') {
        return res.status(401).json({
          error: true,
          message: 'Invalid current password'
        })
      } else if (errorCode === 'auth/weak-password') {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      } else {
        return res.status(500).json({
          error: true,
          message: errorMessage
        })
      }
    })
}

// User Information
exports.addUserData = (req, res) => {
  const timezone = moment().tz('Asia/Jakarta')
  const createdAt = timezone.toString()

  const birthDate = moment(req.body.birthDate, 'D-MM-YYYY').toDate()
  const formattedBirthDate = moment(birthDate).format('DD-MM-YYYY')
  const userId = req.body.userId

  // Get user age
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  // Calorie calculation
  const maleBMR = 66 + (13.7 * req.body.userWeight) + (5 * req.body.userHeight) - (6.8 * age)
  const femaleBMR = 655 + (9.6 * req.body.userWeight) + (1.8 * req.body.userHeight) - (4.7 * age)

  // BMI calculation
  const heightInMeters = req.body.userHeight / 100
  const userBMI = Math.round(req.body.userWeight / (heightInMeters ** 2))

  // Get activity value
  let activityValue = 0

  switch (req.body.activityLevel) {
    case 0:
      activityValue = 1.1
      break
    case 1:
      activityValue = 1.2
      break
    case 2:
      activityValue = 1.3
      break
    default:
      activityValue = 1.1
      break
  }

  // Get stress value
  let stressValue = 0
  switch (req.body.stressLevel) {
    case 0:
      stressValue = 1.1
      break
    case 1:
      stressValue = 1.3
      break
    case 2:
      stressValue = 1.45
      break
    case 3:
      stressValue = 1.55
      break
    case 4:
      stressValue = 1.7
      break
    default:
      stressValue = 1.1
      break
  }

  // Calorie intake calculation
  let calorieIntake = 0
  switch (req.body.gender) {
    case 'Laki-Laki':
      calorieIntake = maleBMR * activityValue * stressValue
      break
    case 'Perempuan':
      calorieIntake = femaleBMR * activityValue * stressValue
      break
    default:
      calorieIntake = maleBMR * activityValue * stressValue
      break
  }

  // Set user calorie intake based on weightGoal
  switch (req.body.weightGoal) {
    case 0:
      calorieIntake = Math.round(calorieIntake * 0.6)
      break
    case 1:
      calorieIntake = Math.round(calorieIntake * 0.8)
      break
    case 2:
      calorieIntake = Math.round(calorieIntake)
      break
    case 3:
      calorieIntake = Math.round(calorieIntake * 1.2)
      break
    case 4:
      calorieIntake = Math.round(calorieIntake * 1.4)
      break
    default:
      calorieIntake = Math.round(calorieIntake)
      break
  }

  const userData = {
    createdAt,
    fullName: req.body.fullName,
    birthDate: formattedBirthDate,
    gender: req.body.gender,
    userWeight: req.body.userWeight,
    userHeight: req.body.userHeight,
    weightGoal: req.body.weightGoal,
    stressLevel: req.body.stressLevel,
    activityLevel: req.body.activityLevel,
    userCalorieIntake: calorieIntake,
    userBMI,
    age,
    photoURL: null
  }

  if (!req.body.fullName || !req.body.birthDate || !req.body.gender || !req.body.userWeight || !req.body.userHeight || req.body.activityLevel === undefined || req.body.stressLevel === undefined || req.body.weightGoal === undefined) {
    return res.status(400).json({
      error: true,
      message: 'Required.'
    })
  }

  const docRef = db.collection('users').doc(userId)

  docRef.get().then(() => {
    docRef.set(userData)
      .then(() => {
        return res.status(200).json({
          error: false,
          message: 'Information saved successfully!'
        })
      })
      .catch((e) => {
        return res.status(500).json({
          error: true,
          message: e
        })
      })
  })
}

exports.getUserData = async (req, res) => {
  const { userId } = req.params

  const docRef = db.collection('users').doc(userId)
  const doc = await docRef.get()

  if (!doc.exists) {
    return res.status(500).json({
      error: true,
      message: 'Data is not exists'
    })
  }

  return res.status(200).json({
    error: false,
    data: doc.data()
  })
}

// Add calorie log to the database
exports.addCalorieLog = async (req, res) => {
  const today = moment().tz('Asia/Jakarta')
  const year = today.format('YYYY')
  const month = today.format('MM')
  const date = today.format('DD')

  const createdAtTime = moment().tz('Asia/Jakarta').format('HH:mm')
  const createdAtDate = moment().tz('Asia/Jakarta').format('DD-MM-YYYY')

  const { userId } = req.params

  if (!req.body.foodName || !req.body.foodCalories || !req.body.fnbType || req.body.mealTime === undefined) {
    return res.status(400).json({
      error: true,
      message: 'Required.'
    })
  }

  const imageUrl = await db.collection('food-calories').doc(req.body.foodName).get().then((doc) => {
    return doc.data().image
  })

  const calorieLogData = {}

  switch (req.body.mealTime) {
    case 0:
      calorieLogData.breakfast = firebase.firestore.FieldValue.arrayUnion({
        foodName: req.body.foodName,
        fnbType: req.body.fnbType,
        foodCalories: req.body.foodCalories,
        createdAtDate,
        createdAtTime,
        imageUrl,
        timestamp: today.toString()
      })
      break
    case 1:
      calorieLogData.lunch = firebase.firestore.FieldValue.arrayUnion({
        foodName: req.body.foodName,
        fnbType: req.body.fnbType,
        foodCalories: req.body.foodCalories,
        createdAtDate,
        createdAtTime,
        imageUrl,
        timestamp: today.toString()
      })
      break
    case 2:
      calorieLogData.dinner = firebase.firestore.FieldValue.arrayUnion({
        foodName: req.body.foodName,
        fnbType: req.body.fnbType,
        foodCalories: req.body.foodCalories,
        createdAtDate,
        createdAtTime,
        imageUrl,
        timestamp: today.toString()
      })
      break
    case 3:
      calorieLogData.others = firebase.firestore.FieldValue.arrayUnion({
        foodName: req.body.foodName,
        fnbType: req.body.fnbType,
        foodCalories: req.body.foodCalories,
        createdAtDate,
        createdAtTime,
        imageUrl,
        timestamp: today.toString()
      })
      break
    default:
      calorieLogData.others = firebase.firestore.FieldValue.arrayUnion({
        foodName: req.body.foodName,
        fnbType: req.body.fnbType,
        foodCalories: req.body.foodCalories,
        createdAtDate,
        createdAtTime,
        imageUrl,
        timestamp: today.toString()
      })
      break
  }

  let totalDailyCalories = req.body.foodCalories

  const docRef = db.collection('calorie-log').doc(userId).collection('foodCollection').doc(year).collection(month).doc(date)

  await docRef.get().then((logDoc) => {
    if (logDoc.exists && logDoc.data().totalDailyCalories) {
      totalDailyCalories += logDoc.data().totalDailyCalories
    }

    calorieLogData.totalDailyCalories = totalDailyCalories

    docRef.set(calorieLogData, { merge: true })
      .then(() => {
        return res.status(200).json({
          error: false,
          message: 'Information saved successfully!'
        })
      }).catch((e) => {
        return res.status(500).json({
          error: true,
          message: e
        })
      })
  })
}

// Get Daily Calorie Log
exports.getDailyCalorieLog = async (req, res) => {
  const { userId, date, month, year } = req.params

  const docRef = db.collection('calorie-log').doc(userId)
  const yearCollection = docRef.collection('foodCollection').doc(year)
  const logCollection = yearCollection.collection(month).doc(date)

  const doc = await logCollection.get()
  if (!doc.exists) {
    return res.status(500).json({
      error: true,
      message: 'Data does not exist'
    })
  }

  const data = doc.data()

  return res.status(200).json({
    error: false,
    data
  })
}

// Get Monthly Calorie Log
exports.getMonthlyCalorieLog = async (req, res) => {
  const { userId, month, year } = req.params

  const docRef = db.collection('calorie-log').doc(userId)
  const yearCollection = docRef.collection('foodCollection').doc(year)
  const logCollection = yearCollection.collection(month)
  try {
    const querySnapshot = await logCollection.get()
    const monthlyLog = []

    let totalMonthlyCalories = 0

    querySnapshot.forEach((doc) => {
      const totalDailyCalories = doc.data().totalDailyCalories

      totalMonthlyCalories += totalDailyCalories

      monthlyLog.push({
        id: doc.id,
        data: doc.data()
      })
    })

    if (totalMonthlyCalories === 0) {
      return res.status(500).json({
        error: true,
        message: 'Data does not exist'
      })
    }

    return res.status(200).json({
      error: false,
      monthlyLog,
      totalMonthlyCalories
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: 'Data does not exist'
    })
  }
}

// Get Food Data
exports.getFoodData = async (req, res) => {
  const { foodName } = req.params

  const docRef = db.collection('food-calories').doc(foodName)
  try {
    const doc = await docRef.get()
    if (!doc.exists) {
      return res.status(500).json({
        error: true,
        message: 'Data does not exist'
      })
    }
    return res.status(200).json({
      error: false,
      data: doc.data()
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: 'Server error'
    })
  }
}

// Get All Foods Data
exports.getAllFoodsData = async (req, res) => {
  const foods = []
  const foodsRef = db.collection('food-calories')
  const snapshot = await foodsRef.get()
  snapshot.forEach(doc => {
    foods.push({
      name: doc.id,
      data: doc.data()
    })
  })
  return res.status(200).json({
    error: false,
    data: foods
  })
}

exports.editUserData = async (req, res) => {
  const { userId } = req.params
  const timezone = moment().tz('Asia/Jakarta')
  const updatedAt = timezone.toString()

  const birthDate = moment(req.body.birthDate, 'D-MM-YYYY').toDate()
  const formattedBirthDate = moment(birthDate).format('DD-MM-YYYY')

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  const file = req.file
  const profileUpdateData = {
    fullName: req.body.fullName,
    gender: req.body.gender,
    birthDate: formattedBirthDate,
    age
  }

  try {
    // Create a reference to the Firebase Storage bucket
    const bucket = admin.storage().bucket()

    // Check if a file is provided for profile photo update
    if (file) {
      // Extract the original file extension
      const originalExtension = file.originalname.split('.').pop()

      // Generate a unique filename with the original file extension
      const filename = `${userId}.${originalExtension}`

      // Upload the file to Firebase Storage
      const fileRef = bucket.file(`profile/${filename}`)
      const uploadStream = fileRef.createWriteStream()

      uploadStream.on('error', (e) => {
        return res.status(500).json({
          error: true,
          message: 'An error occurred while uploading the file.'
        })
      })

      uploadStream.on('finish', async () => {
        // File uploaded successfully

        // Generate the dynamic link for the uploaded image
        const config = {
          action: 'read',
          expires: '03-01-2500' // Replace with the desired expiration date for the link
        }

        const [url] = await fileRef.getSignedUrl(config)

        // Update the user document in the 'users' collection with the photoURL
        profileUpdateData.photoURL = url

        // Update the user data in the 'users' collection
        try {
          await db.collection('users').doc(userId).update(profileUpdateData)
          return res.status(200).json({
            error: false,
            message: 'User data and photo profile updated successfully.',
            data: {
              ...profileUpdateData,
              updatedAt
            }
          })
        } catch (error) {
          return res.status(500).json({
            error: true,
            message: 'An error occurred while updating the user data and photo profile.'
          })
        }
      })

      uploadStream.end(file.buffer)
    } else {
      // No file provided for profile photo update
      // Update only the user data in the 'users' collection
      try {
        await db.collection('users').doc(userId).update(profileUpdateData)
        return res.status(200).json({
          error: false,
          message: 'User data updated successfully.',
          data: {
            ...profileUpdateData,
            updatedAt
          }
        })
      } catch (error) {
        return res.status(500).json({
          error: true,
          message: 'An error occurred while updating the user data.'
        })
      }
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: 'An error occurred while uploading the file.'
    })
  }
}

// Update User Assesment
exports.updateUserAssessment = async (req, res) => {
  const { userId } = req.params

  try {
    // Retrieve user data from the database
    const docRef = db.collection('users').doc(userId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(500).json({
        error: true,
        message: 'Data does not exist.'
      })
    }

    const userData = doc.data()

    // Update the self-assessment data
    userData.userHeight = req.body.userHeight
    userData.userWeight = req.body.userWeight
    userData.weightGoal = req.body.weightGoal

    userData.activityLevel = req.body.activityLevel
    userData.stressLevel = req.body.stressLevel

    // Get birthdate from doc
    const birthDate = moment(userData.birthDate, 'D-MM-YYYY').toDate()

    // Get age from birthdate
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // Calorie calculation
    const maleBMR = 66 + (13.7 * req.body.userWeight) + (5 * req.body.userHeight) - (6.8 * age)
    const femaleBMR = 655 + (9.6 * req.body.userWeight) + (1.8 * req.body.userHeight) - (4.7 * age)

    // BMI calculation
    const heightInMeters = req.body.userHeight / 100
    const userBMI = Math.round(req.body.userWeight / (heightInMeters ** 2))

    // Get BMR value
    userData.BMI = userBMI

    // Get activity value
    let activityValue = 0

    switch (req.body.activityLevel) {
      case 0:
        activityValue = 1.1
        break
      case 1:
        activityValue = 1.2
        break
      case 2:
        activityValue = 1.3
        break
      default:
        activityValue = 1.1
        break
    }

    // Get stress value
    let stressValue = 0
    switch (req.body.stressLevel) {
      case 0:
        stressValue = 1.1
        break
      case 1:
        stressValue = 1.3
        break
      case 2:
        stressValue = 1.45
        break
      case 3:
        stressValue = 1.55
        break
      case 4:
        stressValue = 1.7
        break
      default:
        stressValue = 1.1
        break
    }

    // Calorie intake calculation
    let calorieIntake = 0
    switch (req.body.gender) {
      case 'Laki-Laki':
        calorieIntake = maleBMR * activityValue * stressValue
        break
      case 'Perempuan':
        calorieIntake = femaleBMR * activityValue * stressValue
        break
      default:
        calorieIntake = maleBMR * activityValue * stressValue
        break
    }

    // Set user calorie intake based on weightGoal
    switch (req.body.weightGoal) {
      case 0:
        calorieIntake = Math.round(calorieIntake * 0.6)
        break
      case 1:
        calorieIntake = Math.round(calorieIntake * 0.8)
        break
      case 2:
        calorieIntake = Math.round(calorieIntake)
        break
      case 3:
        calorieIntake = Math.round(calorieIntake * 1.2)
        break
      case 4:
        calorieIntake = Math.round(calorieIntake * 1.4)
        break
      default:
        calorieIntake = Math.round(calorieIntake)
        break
    }

    // update calorie intake
    userData.userCalorieIntake = calorieIntake

    // Update the data in the database
    await docRef.update(userData)

    return res.status(200).json({
      error: false,
      message: 'Information updated successfully!',
      data: userData
    })
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message
    })
  }
}
