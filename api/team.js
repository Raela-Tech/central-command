// api/team.js
// Returns active tasks grouped by team member.
// Team members are identified by Notion user ID.
// GET /api/team

const { getClient, queryTasks, cors } = require('./_notion');

// Add each team member's Notion user ID here once you know them.
// Run GET /api/team-ids to discover them (see api/team-ids.js).
// Dev (4ef63924) and Ops (b5fec8db) are group placeholders — excluded intentionally.
// Austin and Alaina are not direct reports — excluded intentionally.
const TEAM = [
  { id: 'meghana', name: 'Meghana Korada',  role: 'Data Engineer', notionUserId: '2cdd872b-594c-81b0-9d22-00021ec63420' },
  { id: 'joshua',  name: 'Joshua Bonivert', role: 'App Dev',        notionUserId: '317d872b-594c-81c4-975a-0002fc307b11' },
  { id: 'jarod',   name: 'Jarod Cavagnaro', role: 'FDE',            notionUserId: '32dd872b-594c-810d-81c5-0002d4b2b48d' },
];

// Derive a status signal from a person's task list
function deriveStatus(tasks) {
  const hasCritical = tasks.some(t => t.priority === 'Critical');
  const hasBlocked  = tasks.some(t => t.status === 'Blocked');
  const count       = tasks.length;
  if (hasBlocked)        return 'blocked';
  if (hasCritical)       return 'overloaded';
  if (count > 4)         return 'overloaded';
  return 'on-track';
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const notion = getClient();

    // Fetch tasks for each team member in parallel
    const results = await Promise.all(
      TEAM.map(async member => {
        const filter = {
          property: 'Assigned To',
          rich_text: { contains: member.name },
        };

        const tasks = await queryTasks(notion, filter);
        const blockers = tasks
          .filter(t => t.status === 'Blocked' && t.blockedBy)
          .map(t => t.blockedBy);

        return {
          id:       member.id,
          name:     member.name,
          role:     member.role,
          status:   deriveStatus(tasks),
          hero:     tasks[0] ? {
            title:    tasks[0].title,
            priority: tasks[0].priority,
            since:    tasks[0].age,
          } : null,
          queue: tasks.slice(0, 5).map(t => ({
            title:    t.title,
            priority: t.priority,
            tag:      t.category,
            status:   t.status,
          })),
          blockers,
        };
      })
    );

    return res.status(200).json({
      team: results,
      meta: { syncedAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[/api/team]', err);
    return res.status(500).json({ error: err.message });
  }
};
