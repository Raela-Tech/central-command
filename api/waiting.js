// api/waiting.js
// Stub that returns an empty waiting list until you create a Waiting On DB in Notion.
// When ready: create a Notion DB with properties:
//   Item (title), Waiting on (text), Date flagged (date), Status (select: Active/Resolved)
// Then replace this stub with a real queryTasks call filtered to Status = Active.
// GET /api/waiting

const { cors } = require('./_notion');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    waiting: [],
    meta: {
      stub: true,
      message: 'Create a Waiting On DB in Notion and wire it here.',
      syncedAt: new Date().toISOString(),
    },
  });
};
