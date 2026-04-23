// api/tasks.js
// Returns the current user's active tasks, sorted by priority then due date.
// GET /api/tasks

const { getClient, queryTasks, cors } = require('./_notion');

const MY_NAME = 'Sydney Nichols';

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const notion = getClient();

    const myTasksFilter = {
      property: 'Assigned To',
      rich_text: { contains: MY_NAME },
    };

    const tasks = await queryTasks(notion, myTasksFilter);

    // Separate into priority groups for the app
    const grouped = {
      Critical: tasks.filter(t => t.priority === 'Critical'),
      High:     tasks.filter(t => t.priority === 'High'),
      Medium:   tasks.filter(t => t.priority === 'Medium'),
    };

    // Flat list with all tasks — app can group itself
    return res.status(200).json({
      tasks,
      grouped,
      meta: {
        total: tasks.length,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[/api/tasks]', err);
    return res.status(500).json({ error: err.message });
  }
};
