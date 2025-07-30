import express from 'express'
import pool from './db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('API Music Attendance fonctionne !')
})

// Création utilisateur - inchangé
app.post('/users', async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Champs manquants' })
    }

    const userExist = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Nom d’utilisateur déjà pris' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [
      username,
      hashedPassword,
      role,
    ])

    res.status(201).json({ message: 'Utilisateur créé avec succès' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Connexion utilisateur - on génère un token JWT
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Champs manquants' })
    }

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Utilisateur non trouvé' })
    }

    const user = userResult.rows[0]

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    // Générer un token avec payload minimal (id, username, role)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Middleware pour vérifier token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Token manquant' })

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' })
    req.user = user
    next()
  })
}

// Exemple d’une route protégée
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Accès autorisé', user: req.user })
})

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`)
})
