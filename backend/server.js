const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// const pool = new Pool({
//   user: process.env.PG_USER || 'postgres',
//   host: process.env.PG_HOST || 'localhost',
//   database: process.env.PG_DATABASE || 'learning_tracker',
//   password: process.env.PG_PASSWORD || 'your_password',
//   port: process.env.PG_PORT || 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon to handle self-signed certificates
  }
});

// Get all phases with nested weeks, days, tasks, and notes
app.get('/api/roadmap', async (req, res) => {
  try {
    const phasesResult = await pool.query('SELECT * FROM phases');
    const phases = phasesResult.rows;

    for (let phase of phases) {
      const weeksResult = await pool.query('SELECT * FROM weeks WHERE phase_id = $1', [phase.id]);
      phase.weeks = weeksResult.rows;

      for (let week of phase.weeks) {
        const daysResult = await pool.query('SELECT * FROM days WHERE week_id = $1', [week.id]);
        week.days = daysResult.rows;

        for (let day of week.days) {
          const tasksResult = await pool.query('SELECT * FROM tasks WHERE day_id = $1', [day.id]);
          day.tasks = tasksResult.rows;

          for (let task of day.tasks) {
            const notesResult = await pool.query('SELECT * FROM notes WHERE task_id = $1', [task.id]);
            task.notes = {
              to_be_done: [],
              to_be_practiced: [],
              to_be_searched: [],
              to_be_used_as_reference: [],
            };
            notesResult.rows.forEach((note) => {
              task.notes[note.category].push({ id: note.id, content: note.content });
            });
          }
        }
      }
    }
    res.json({ phases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task completion
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed must be a boolean' });
  }
  try {
    const result = await pool.query('UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *', [completed, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add note to task
app.post('/api/tasks/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { category, content } = req.body;
  if (!['to_be_done', 'to_be_practiced', 'to_be_searched', 'to_be_used_as_reference'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Content must be a non-empty string' });
  }
  try {
    const taskCheck = await pool.query('SELECT 1 FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await pool.query('INSERT INTO notes (task_id, category, content) VALUES ($1, $2, $3)', [id, category, content]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Content must be a non-empty string' });
  }
  try {
    const result = await pool.query('UPDATE notes SET content = $1 WHERE id = $2 RETURNING *', [content, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Populate database with initial roadmap data
app.post('/api/populate', async (req, res) => {
  try {
    // Check if database is already populated
    const phaseCount = await pool.query('SELECT COUNT(*) FROM phases');
    if (parseInt(phaseCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Database already populated' });
    }

    const roadmap = require('../public/roadmap.json');
    for (const phase of roadmap.phases) {
      const phaseResult = await pool.query('INSERT INTO phases (title) VALUES ($1) RETURNING id', [phase.title]);
      const phaseId = phaseResult.rows[0].id;

      for (const week of phase.weeks) {
        const weekResult = await pool.query('INSERT INTO weeks (phase_id, title) VALUES ($1, $2) RETURNING id', [phaseId, week.title]);
        const weekId = weekResult.rows[0].id;

        for (const day of week.days) {
          const dayResult = await pool.query('INSERT INTO days (week_id, title) VALUES ($1, $2) RETURNING id', [weekId, day.title]);
          const dayId = dayResult.rows[0].id;

          for (const task of day.tasks) {
            const taskResult = await pool.query('INSERT INTO tasks (day_id, description, completed) VALUES ($1, $2, $3) RETURNING id', [dayId, task.description, task.completed]);
            const taskId = taskResult.rows[0].id;

            for (const [category, items] of Object.entries(task.notes)) {
              for (const item of items) {
                await pool.query('INSERT INTO notes (task_id, category, content) VALUES ($1, $2, $3)', [taskId, category, item]);
              }
            }
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));