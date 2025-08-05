import express from 'express'
import pool from './db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('API Music Attendance fonctionne !')
})

// Création utilisateur
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

// GET toutes les classes
app.get('/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classes ORDER BY id')
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST création classe
app.post('/classes', async (req, res) => {
  try {
    const { nom, description, user_id } = req.body
    if (!nom || !user_id) {
      return res.status(400).json({ error: 'Nom et user_id obligatoires' })
    }
    await pool.query('INSERT INTO classes (nom, description, user_id) VALUES ($1, $2, $3)', [
      nom,
      description || null,
      user_id,
    ])
    res.status(201).json({ message: 'Classe créée avec succès' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.get('/classes/:id', async (req, res) => {
  const classId = req.params.id

  try {
    const result = await pool.query('SELECT * FROM classes WHERE id = $1', [classId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classe non trouvée' })
    }

    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Modifier une classe
app.put('/classes/:id', async (req, res) => {
  const id = req.params.id
  const { nom, description } = req.body

  if (!nom) {
    return res.status(400).json({ error: 'Nom requis' })
  }

  try {
    const result = await pool.query(
      'UPDATE classes SET nom = $1, description = $2 WHERE id = $3 RETURNING *',
      [nom, description, id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Classe non trouvée' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Erreur PUT /classes/:id', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer une classe
app.delete('/classes/:id', async (req, res) => {
  const id = req.params.id

  try {
    const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Classe non trouvée' })
    }

    res.json({ message: 'Classe supprimée', deleted: result.rows[0] })
  } catch (err) {
    console.error('Erreur DELETE /classes/:id', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Exemple d’une route protégée
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Accès autorisé', user: req.user })
})

// Récupérer toutes les classes
app.get('/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classes ORDER BY nom')
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ajouter une nouvelle classe
app.post('/classes', async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    await pool.query('INSERT INTO classes (nom, description) VALUES ($1, $2)', [
      name,
      description || '',
    ])
    res.status(201).json({ message: 'Classe créée' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`)
})
