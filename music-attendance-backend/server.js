// server.js

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Pool } = require('pg')

// ─────────────────────────────────────────────────────────────
// Création du serveur
// ─────────────────────────────────────────────────────────────
const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(bodyParser.json())

// ─────────────────────────────────────────────────────────────
// Connexion à PostgreSQL
// ─────────────────────────────────────────────────────────────
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// ─────────────────────────────────────────────────────────────
/** Middlewares d’authentification / autorisation */
// ─────────────────────────────────────────────────────────────
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

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.sendStatus(403)
    next()
  }
}

// ─────────────────────────────────────────────────────────────
/** AUTH */
// ─────────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ message: 'Username et mot de passe requis' })

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()])
    if (result.rows.length === 0) return res.status(401).json({ message: 'Utilisateur non trouvé' })

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ message: 'Mot de passe incorrect' })

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('Erreur serveur login:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─────────────────────────────────────────────────────────────
/** CLASSES (legacy + nouvelle /api/classes) */
// ─────────────────────────────────────────────────────────────

// Legacy : Admin → toutes les classes
app.get('/classes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom AS name FROM classes ORDER BY nom ASC')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Legacy : Prof/Admin → classes de l’utilisateur
app.get('/my-classes', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.nom AS name
       FROM classes c
       JOIN class_users cu ON cu.class_id = c.id
       WHERE cu.user_id = $1
       ORDER BY c.nom ASC`,
      [req.user.id],
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Nouveau : /api/classes → point unique pour le front
const classesRouter = express.Router()

classesRouter.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query('SELECT id, nom AS name FROM classes ORDER BY nom ASC')
      return res.json(result.rows)
    }
    if (req.user.role === 'prof') {
      const result = await pool.query(
        `SELECT c.id, c.nom AS name
         FROM classes c
         JOIN class_users cu ON cu.class_id = c.id
         WHERE cu.user_id = $1
         ORDER BY c.nom ASC`,
        [req.user.id],
      )
      return res.json(result.rows)
    }
    return res.status(403).json({ message: 'Accès interdit' })
  } catch (err) {
    console.error('Erreur route /api/classes :', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

app.use('/api/classes', classesRouter)

// ─────────────────────────────────────────────────────────────
/** STUDENTS (/api/students) */
// ─────────────────────────────────────────────────────────────
const studentsRouter = express.Router()

// Ajouter un élève
studentsRouter.post('/', async (req, res) => {
  try {
    const { firstname, lastname, class_id, phone } = req.body
    const result = await pool.query(
      'INSERT INTO students (firstname, lastname, class_id, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstname, lastname, class_id, phone],
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erreur serveur')
  }
})

// Récupérer tous les élèves d’une classe
studentsRouter.get('/:class_id', async (req, res) => {
  try {
    const { class_id } = req.params
    const result = await pool.query(
      'SELECT * FROM students WHERE class_id = $1 ORDER BY lastname ASC',
      [class_id],
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erreur serveur')
  }
})

app.use('/api/students', studentsRouter)

// ─────────────────────────────────────────────────────────────
/** SESSIONS (/sessions) */
// ─────────────────────────────────────────────────────────────
const sessionsRouter = express.Router()

// GET toutes les dates d’une classe
sessionsRouter.get('/:classId', async (req, res) => {
  try {
    const { classId } = req.params
    const { rows } = await pool.query(
      'SELECT id, date FROM sessions WHERE class_id = $1 ORDER BY date ASC',
      [classId],
    )
    const sessions = rows.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
    }))
    res.json(sessions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST ajouter des dates pour une classe (évite les doublons)
sessionsRouter.post('/', async (req, res) => {
  try {
    const { class_id, dates } = req.body
    if (!class_id || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Classe ou dates manquantes' })
    }

    const existingResult = await pool.query('SELECT date FROM sessions WHERE class_id = $1', [
      class_id,
    ])
    const existingDates = existingResult.rows.map((row) => row.date.toISOString().split('T')[0])

    const newDates = dates.filter((d) => !existingDates.includes(d))

    if (newDates.length > 0) {
      const insertQuery = `
        INSERT INTO sessions (class_id, date)
        VALUES ${newDates.map((_, i) => `($1, $${i + 2})`).join(',')}
        RETURNING *;
      `
      const insertValues = [class_id, ...newDates]
      await pool.query(insertQuery, insertValues)
    }

    const allDates = [...existingDates, ...newDates].sort()
    res.json(allDates)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.use('/sessions', sessionsRouter)

// ─────────────────────────────────────────────────────────────
/** ATTENDANCE */
// ─────────────────────────────────────────────────────────────

app.get(
  '/attendance/:classId',
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  async (req, res) => {
    try {
      const { classId } = req.params
      const { rows } = await pool.query(
        `SELECT a.student_id, a.session_id, a.status
       FROM attendances a
       JOIN sessions s ON s.id = a.session_id
       WHERE s.class_id = $1`,
        [classId],
      )
      res.json(rows) // [{ student_id, session_id, status }]
    } catch (err) {
      console.error('GET /attendance/:classId', err)
      res.status(500).json({ message: 'Erreur serveur' })
    }
  },
)

app.post('/attendance', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  try {
    let { student_id, session_id, status } = req.body

    student_id = Number(student_id)
    session_id = Number(session_id)
    if (!student_id || !session_id || !status) {
      return res.status(400).json({ message: 'Paramètres manquants' })
    }

    // normalisation + validation
    const allowed = new Set(['present', 'late', 'absent'])
    if (status === 'excused') status = 'absent'
    if (!allowed.has(status)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    // vérifier existences pour erreurs lisibles
    const fk = await pool.query(
      `SELECT
         (SELECT 1 FROM students WHERE id = $1) AS has_student,
         (SELECT 1 FROM sessions WHERE id = $2) AS has_session`,
      [student_id, session_id],
    )
    if (!fk.rows[0].has_student) return res.status(400).json({ message: 'Élève introuvable' })
    if (!fk.rows[0].has_session) return res.status(400).json({ message: 'Session introuvable' })

    // UPSERT dans attendances
    await pool.query(
      `INSERT INTO attendances (student_id, session_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, session_id)
       DO UPDATE SET status = EXCLUDED.status`,
      [student_id, session_id, status],
    )

    res.json({ message: 'Présence enregistrée' })
  } catch (err) {
    // codes fréquents PG : 42P10 (pas d’unique), 23503 (FK), 23514 (CHECK)
    if (err.code === '42P10') {
      return res
        .status(500)
        .json({
          message: "Ajoute l'index unique sur attendances(student_id, session_id) pour ON CONFLICT",
        })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Clé étrangère invalide (élève ou session)' })
    }
    if (err.code === '23514') {
      return res.status(400).json({ message: 'Statut non autorisé par le CHECK' })
    }
    console.error('POST /attendance error:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
})
