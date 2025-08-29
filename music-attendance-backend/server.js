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

// ---- Mapping & conversions ----
// utils déjà vus (UTC midi, année scolaire, normalisation weekday…)
function utcNoon(y, m0, d) {
  return new Date(Date.UTC(y, m0, d, 12))
}
function schoolStartYear(now = new Date()) {
  const y = now.getUTCFullYear(),
    m = now.getUTCMonth() + 1
  return m >= 9 ? y : y - 1
}
function getActiveSchoolYear(now = new Date()) {
  const sy = schoolStartYear(now)
  return { start: utcNoon(sy, 8, 1), end: utcNoon(sy + 1, 6, 14) }
}
const ISO_FROM_FR = {
  dimanche: 7,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
}
function normalizeToIsoWeekday(input) {
  if (typeof input === 'string') {
    return ISO_FROM_FR[input.toLowerCase()] ?? null
  }
  if (typeof input === 'number') {
    if (input >= 1 && input <= 7) return input
    if (input >= 0 && input <= 6) return input + 1
  }
  return null
}
function jsDowFromIso(iso) {
  return iso % 7
}
function firstOnOrAfter(startUtc, jsTarget) {
  const d = new Date(startUtc.getTime())
  const delta = (jsTarget - d.getUTCDay() + 7) % 7
  d.setUTCDate(d.getUTCDate() + delta)
  return d
}
function enumerateDatesByWeekday(startUtc, endUtc, isoDow) {
  const jsTarget = jsDowFromIso(isoDow)
  const s = utcNoon(startUtc.getUTCFullYear(), startUtc.getUTCMonth(), startUtc.getUTCDate())
  const e = utcNoon(endUtc.getUTCFullYear(), endUtc.getUTCMonth(), endUtc.getUTCDate())
  let d = firstOnOrAfter(s, jsTarget)
  const out = []
  while (d <= e) {
    out.push(d.toISOString().slice(0, 10))
    d = new Date(d.getTime() + 7 * 86400000)
  }
  return out
}

// PATCH /classes/:id/weekday  { weekday: 1..7 | 'lundi' ... , startYear? }
// même middlewares qu'avant
const patchClassWeekdayHandler = async (req, res) => {
  try {
    const classId = Number(req.params.id)
    const iso = normalizeToIsoWeekday(req.body.weekday)
    if (!iso) return res.status(400).json({ message: 'weekday invalide' })

    await pool.query('UPDATE classes SET weekday=$1 WHERE id=$2', [iso, classId])

    const sy = Number.isInteger(req.body.startYear) ? req.body.startYear : schoolStartYear()
    const start = utcNoon(sy, 8, 1)
    const end = utcNoon(sy + 1, 6, 14)

    // nettoyer sessions d’un autre DOW (sans présence)
    await pool.query(
      `
      WITH cls AS (
        SELECT id, CASE WHEN weekday=7 THEN 0 ELSE weekday END AS js_dow
        FROM classes WHERE id=$1
      )
      DELETE FROM sessions s
      USING cls
      WHERE s.class_id = cls.id
        AND EXTRACT(DOW FROM s.date) <> cls.js_dow
        AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.session_id = s.id);
    `,
      [classId],
    )

    // régénérer les dates (01/09 -> 14/07)
    const dates = enumerateDatesByWeekday(start, end, iso)
    await pool.query(
      `
      INSERT INTO sessions (class_id, date)
      SELECT $1, unnest($2::date[])
      ON CONFLICT (class_id, date) DO NOTHING
    `,
      [classId, dates],
    )

    // renvoyer les sessions
    const { rows } = await pool.query(
      'SELECT id, date FROM sessions WHERE class_id=$1 ORDER BY date',
      [classId],
    )
    res.json({
      ok: true,
      sessions: rows.map((r) => ({ id: r.id, date: r.date.toISOString().slice(0, 10) })),
    })
  } catch (e) {
    console.error('PATCH weekday', e)
    res.status(500).json({ message: 'Erreur mise à jour du jour de classe' })
  }
}

// ✅ expose les deux chemins pour éviter les 404
app.patch(
  ['/api/classes/:id/weekday', '/classes/:id/weekday'],
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  patchClassWeekdayHandler,
)

// POST /classes/:id/generate-sessions
app.post(
  '/classes/:id/generate-sessions',
  authenticateToken,
  authorizeRoles('prof', 'admin'),
  async (req, res) => {
    try {
      const classId = Number(req.params.id)
      if (!Number.isInteger(classId)) {
        return res.status(400).json({ message: 'classId invalide' })
      }

      // Charger la classe (pour récupérer un weekday éventuellement déjà stocké)
      const cl = await pool.query('SELECT id, weekday FROM classes WHERE id = $1', [classId])
      if (!cl.rows[0]) return res.status(404).json({ message: 'Classe introuvable' })

      // 1) Normaliser le weekday venant du body ou de la classe (vers ISO 1..7)
      let isoWeekday = normalizeToIsoWeekday(req.body?.weekday)
      if (isoWeekday == null) isoWeekday = normalizeToIsoWeekday(cl.rows[0].weekday)
      if (isoWeekday == null) {
        return res.status(400).json({ message: 'Jour de cours requis (weekday)' })
      }

      // 2) Mémoriser l’ISO weekday (1..7) sur la classe si différent
      if (cl.rows[0].weekday !== isoWeekday) {
        await pool.query('UPDATE classes SET weekday = $1 WHERE id = $2', [isoWeekday, classId])
      }

      // 3) Fenêtre année scolaire active (01/09 -> 14/07) en UTC
      const { start, end } = getActiveSchoolYear()

      // 4) Génération des dates (sans doublon côté DB via ON CONFLICT)
      const allDates = enumerateDatesByWeekday(start, end, isoWeekday)

      // 5) Insertion en masse + comptage des lignes réellement insérées
      const insertSql = `
        INSERT INTO sessions (class_id, date)
        SELECT $1, unnest($2::date[])
        ON CONFLICT (class_id, date) DO NOTHING
        RETURNING id
      `
      const insRes = await pool.query(insertSql, [classId, allDates])
      const inserted = insRes.rowCount

      // 6) Retourner la liste complète (id + YYYY-MM-DD)
      const { rows } = await pool.query(
        'SELECT id, date FROM sessions WHERE class_id = $1 ORDER BY date ASC',
        [classId],
      )
      const sessions = rows.map((r) => ({ id: r.id, date: r.date.toISOString().slice(0, 10) }))

      res.json({ ok: true, inserted, total: sessions.length, sessions })
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
