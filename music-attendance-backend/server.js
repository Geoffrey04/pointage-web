// server.js

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Pool } = require('pg')

// Création du serveur
const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(bodyParser.json())

// Connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Middleware pour vérifier le rôle (admin ou prof)
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.sendStatus(403)
    }
    next()
  }
}

// =======================
//       ROUTES
// =======================

// Authentification
// Route login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Vérification que les champs sont présents
    if (!username || !password) {
      return res.status(400).json({ message: 'Username et mot de passe requis' })
    }

    // Récupérer l'utilisateur en base
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()])
    if (result.rows.length === 0) {
      console.log(`Login échoué: utilisateur "${username}" non trouvé`)
      return res.status(401).json({ message: 'Utilisateur non trouvé' })
    }

    const user = result.rows[0]

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      console.log(`Login échoué: mot de passe incorrect pour "${username}"`)
      return res.status(401).json({ message: 'Mot de passe incorrect' })
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )

    console.log(`Login réussi: ${username}`)

    // Retourner le token et l'utilisateur
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('Erreur serveur login:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Récupérer toutes les classes (admin seulement)
app.get('/classes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classes')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Récupérer les classes d’un professeur
app.get('/my-classes', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*
       FROM classes c
       JOIN class_users cu ON cu.class_id = c.id
       WHERE cu.user_id = $1`,
      [req.user.id],
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Récupérer les élèves d’une classe
app.get(
  '/classes/:id/students',
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM students WHERE class_id = $1', [req.params.id])
      res.json(result.rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erreur serveur' })
    }
  },
)

// Marquer une présence
app.post('/attendance', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  const { student_id, session_id, status } = req.body
  try {
    await pool.query(
      'INSERT INTO attendance (student_id, session_id, status) VALUES ($1, $2, $3)',
      [student_id, session_id, status],
    )
    res.json({ message: 'Présence enregistrée' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// =======================
//   LANCEMENT SERVEUR
// =======================
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
})
