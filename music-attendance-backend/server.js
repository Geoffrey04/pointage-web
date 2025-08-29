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
// Middlewares d’authentification / autorisation
// ─────────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401) // unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403) // forbidden
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
// AUTH
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

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (err) {
    console.error('Erreur serveur login:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─────────────────────────────────────────────────────────────
// ADMIN API
// ─────────────────────────────────────────────────────────────
const admin = express.Router()
admin.use(authenticateToken, authorizeRoles('admin'))

// Liste des profs (pour le select)
admin.get('/profs', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username FROM users WHERE role = 'prof' ORDER BY username ASC",
    )
    res.json(rows)
  } catch (e) {
    console.error('admin/profs', e)
    res.status(500).json({ message: 'Erreur chargement profs' })
  }
})

// KPIs
admin.get('/stats', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)    AS users,
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM classes)  AS classes,
        (SELECT COUNT(*) FROM sessions) AS sessions
    `)
    res.json(rows[0])
  } catch (e) {
    console.error('admin/stats', e)
    res.status(500).json({ message: 'Erreur stats' })
  }
})

// Taux de présence par classe
admin.get('/attendance-rate', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.nom AS name,
             COUNT(a.*) AS marked,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS presents,
             ROUND(
               CASE WHEN COUNT(a.*)=0 THEN 0
                    ELSE 100.0*SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)/COUNT(a.*)
               END, 1
             ) AS rate
      FROM classes c
      LEFT JOIN sessions s ON s.class_id = c.id
      LEFT JOIN attendances a ON a.session_id = s.id
      GROUP BY c.id, c.nom
      ORDER BY c.nom ASC;
    `)
    res.json(rows)
  } catch (e) {
    console.error('admin/attendance-rate', e)
    res.status(500).json({ message: 'Erreur stats présence' })
  }
})

// Classes - lecture
admin.get('/classes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom AS name, description, user_id AS owner_id FROM classes ORDER BY nom ASC',
    )
    res.json(rows)
  } catch (e) {
    console.error('admin/classes', e)
    res.status(500).json({ message: 'Erreur chargement classes' })
  }
})

// Helpers pour synchroniser class_users avec owner_id
async function upsertOwnerLink(classId, ownerId) {
  if (!ownerId) return
  await pool.query(
    `INSERT INTO class_users (class_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [classId, ownerId],
  )
}

// Classes - création
admin.post('/classes', async (req, res) => {
  try {
    const { name, description, owner_id } = req.body
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis' })

    const { rows } = await pool.query(
      `INSERT INTO classes (nom, description, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, nom AS name, description, user_id AS owner_id`,
      [name.trim(), description ?? null, owner_id ?? null],
    )

    // sync class_users pour que le prof voie direct la classe
    await upsertOwnerLink(rows[0].id, owner_id)

    res.json(rows[0])
  } catch (e) {
    console.error('admin POST /classes', e)
    res.status(500).json({ message: 'Erreur création' })
  }
})

// Classes - édition
admin.patch('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, owner_id } = req.body

    const { rows } = await pool.query(
      `UPDATE classes
         SET nom = COALESCE($1, nom),
             description = COALESCE($2, description),
             user_id = $3
       WHERE id = $4
       RETURNING id, nom AS name, description, user_id AS owner_id`,
      [name ?? null, description ?? null, owner_id ?? null, id],
    )
    if (!rows[0]) return res.status(404).json({ message: 'Classe introuvable' })

    await upsertOwnerLink(id, owner_id)

    res.json(rows[0])
  } catch (e) {
    console.error('admin PATCH /classes/:id', e)
    res.status(500).json({ message: 'Erreur mise à jour' })
  }
})

// Classes - suppression
admin.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM classes WHERE id = $1', [id])
    res.json({ ok: true })
  } catch (e) {
    console.error('admin DELETE /classes/:id', e)
    res.status(500).json({ message: 'Erreur suppression' })
  }
})

// Multi-prof (optionnel)
admin.post('/class-users', async (req, res) => {
  try {
    const { class_id, user_id } = req.body
    if (!class_id || !user_id) return res.status(400).json({ message: 'Paramètres manquants' })
    await pool.query(
      `INSERT INTO class_users (class_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [class_id, user_id],
    )
    res.json({ ok: true })
  } catch (e) {
    console.error('admin POST /class-users', e)
    res.status(500).json({ message: 'Erreur liaison' })
  }
})

admin.delete('/class-users', async (req, res) => {
  try {
    const { class_id, user_id } = req.body
    await pool.query('DELETE FROM class_users WHERE class_id = $1 AND user_id = $2', [
      class_id,
      user_id,
    ])
    res.json({ ok: true })
  } catch (e) {
    console.error('admin DELETE /class-users', e)
    res.status(500).json({ message: 'Erreur délier' })
  }
})

app.use('/api/admin', admin)

// Helper: année scolaire active (Aug 1 -> Jul 31)
function getActiveSchoolYear() {
  const today = new Date()
  const y = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1
  const start = new Date(Date.UTC(y, 7, 1)) // 1 Aug y
  const end = new Date(Date.UTC(y + 1, 6, 31)) // 31 Jul y+1
  return { start, end, label: `${y}-${y + 1}` }
}

// Convertit ISO dow (1..7, Lundi..Dimanche) -> JS dow (0..6, Dim..Sam)
function jsDowFromIso(iso) {
  return iso % 7
}

// Génère toutes les dates yyyy-mm-dd pour un jour donné dans un intervalle
function enumerateDatesByWeekday(start, end, isoDow) {
  const jsTarget = jsDowFromIso(isoDow)
  const dates = []
  // Trouver le premier jour demandé >= start
  const d = new Date(start)
  while (d.getUTCDay() !== jsTarget) d.setUTCDate(d.getUTCDate() + 1)
  // Ajouter semaine par semaine
  while (d <= end) {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
    d.setUTCDate(d.getUTCDate() + 7)
  }
  return dates
}

// POST /classes/:id/generate-sessions
app.post(
  '/classes/:id/generate-sessions',
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  async (req, res) => {
    try {
      const classId = Number(req.params.id)
      let { weekday } = req.body // attendu: 1..7 (Lundi..Dimanche)

      // Charger la classe
      const cl = await pool.query('SELECT id, weekday FROM classes WHERE id = $1', [classId])
      if (!cl.rows[0]) return res.status(404).json({ message: 'Classe introuvable' })

      // Si aucun weekday fourni, utiliser celui mémorisé
      if (!weekday) weekday = cl.rows[0].weekday
      if (!weekday) return res.status(400).json({ message: 'Jour de cours requis (weekday 1..7)' })
      weekday = Number(weekday)
      if (weekday < 1 || weekday > 7)
        return res.status(400).json({ message: 'weekday invalide (1..7)' })

      // Mémoriser le weekday sur la classe s’il a changé
      if (cl.rows[0].weekday !== weekday) {
        await pool.query('UPDATE classes SET weekday = $1 WHERE id = $2', [weekday, classId])
      }

      // Calcul de l’année scolaire active
      const { start, end } = getActiveSchoolYear()
      const allDates = enumerateDatesByWeekday(start, end, weekday)

      // Écarter les dates déjà présentes
      const existing = await pool.query('SELECT date FROM sessions WHERE class_id = $1', [classId])
      const existingSet = new Set(existing.rows.map((r) => r.date.toISOString().split('T')[0]))
      const toInsert = allDates.filter((d) => !existingSet.has(d))

      // Insertion bulk (si nécessaire)
      if (toInsert.length > 0) {
        const values = toInsert.map((_, i) => `($1, $${i + 2})`).join(',')
        await pool.query(
          `INSERT INTO sessions (class_id, date) VALUES ${values} ON CONFLICT DO NOTHING`,
          [classId, ...toInsert],
        )
      }

      // Retourner la liste des sessions (id + date)
      const { rows } = await pool.query(
        'SELECT id, date FROM sessions WHERE class_id = $1 ORDER BY date ASC',
        [classId],
      )
      const sessions = rows.map((r) => ({ id: r.id, date: r.date.toISOString().split('T')[0] }))
      res.json({ ok: true, inserted: toInsert.length, total: sessions.length, sessions })
    } catch (e) {
      console.error('generate-sessions', e)
      res.status(500).json({ message: 'Erreur génération sessions' })
    }
  },
)

// ─────────────────────────────────────────────────────────────
// CLASSES (legacy + endpoint unifié /api/classes)
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

// Legacy : Prof/Admin → classes de l’utilisateur (tolérant owner OR class_users)
app.get('/my-classes', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { rows } = await pool.query(
        'SELECT id, nom AS name, description, user_id AS owner_id FROM classes ORDER BY nom ASC',
      )
      return res.json(rows)
    }

    const { rows } = await pool.query(
      `
      SELECT DISTINCT c.id, c.nom AS name, c.description, c.user_id AS owner_id
      FROM classes c
      LEFT JOIN class_users cu ON cu.class_id = c.id
      WHERE c.user_id = $1 OR cu.user_id = $1
      ORDER BY c.nom ASC
    `,
      [req.user.id],
    )

    res.json(rows)
  } catch (err) {
    console.error('Erreur route /my-classes :', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// Nouveau : /api/classes → point unique utilisé par le front
const classesRouter = express.Router()
classesRouter.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query('SELECT id, nom AS name FROM classes ORDER BY nom ASC')
      return res.json(result.rows)
    }
    if (req.user.role === 'prof') {
      const result = await pool.query(
        `
        SELECT DISTINCT c.id, c.nom AS name
        FROM classes c
        LEFT JOIN class_users cu ON cu.class_id = c.id
        WHERE c.user_id = $1 OR cu.user_id = $1
        ORDER BY c.nom ASC
      `,
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
// STUDENTS (/api/students)
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

// DELETE /api/students/:id
app.delete('/api/students/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id invalide' })
  try {
    const q = 'DELETE FROM students WHERE id=$1'
    const { rowCount } = await pool.query(q, [id])
    if (rowCount === 0) return res.status(404).json({ error: 'élève introuvable' })
    return res.status(204).end()
  } catch (err) {
    console.error('delete student', err)
    return res.status(500).json({ error: 'server_error' })
  }
})

app.use('/api/students', studentsRouter)

// ─────────────────────────────────────────────────────────────
// SESSIONS (/sessions)
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
// ATTENDANCE
// ─────────────────────────────────────────────────────────────
app.get(
  '/attendance/:classId',
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  async (req, res) => {
    try {
      const { classId } = req.params
      const { rows } = await pool.query(
        `SELECT a.student_id, a.session_id, a.status, a.comment
         FROM attendances a
         JOIN sessions s ON s.id = a.session_id
         WHERE s.class_id = $1`,
        [classId],
      )
      res.json(rows) // [{ student_id, session_id, status, comment }]
    } catch (err) {
      console.error('GET /attendance/:classId', err)
      res.status(500).json({ message: 'Erreur serveur' })
    }
  },
)

app.post('/attendance', authenticateToken, authorizeRoles('prof', 'admin'), async (req, res) => {
  try {
    let { student_id, session_id, status, comment } = req.body

    student_id = Number(student_id)
    session_id = Number(session_id)
    if (!student_id || !session_id || !status) {
      return res.status(400).json({ message: 'Paramètres manquants' })
    }

    // statuts autorisés
    const allowed = new Set(['present', 'absent', 'excused'])
    if (!allowed.has(status)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    // commentaire requis si excused
    if (status === 'excused') {
      if (!comment || !String(comment).trim()) {
        return res.status(400).json({ message: 'Commentaire requis pour "excusé(e)"' })
      }
      comment = String(comment).trim()
    } else {
      // pour les autres statuts, on remet le commentaire à NULL
      comment = null
    }

    // vérifier existences pour erreurs lisibles
    const fk = await pool.query(
      `SELECT
         (SELECT 1 FROM students WHERE id = $1) AS has_student,
         (SELECT 1 FROM sessions  WHERE id = $2) AS has_session`,
      [student_id, session_id],
    )
    if (!fk.rows[0].has_student) return res.status(400).json({ message: 'Élève introuvable' })
    if (!fk.rows[0].has_session) return res.status(400).json({ message: 'Session introuvable' })

    // UPSERT
    await pool.query(
      `INSERT INTO attendances (student_id, session_id, status, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, session_id)
       DO UPDATE SET status = EXCLUDED.status, comment = EXCLUDED.comment`,
      [student_id, session_id, status, comment],
    )

    res.json({ message: 'Présence enregistrée' })
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ message: 'Commentaire requis pour "excusé(e)"' })
    }
    console.error('POST /attendance error:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─────────────────────────────────────────────────────────────
// Démarrage serveur
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
})
