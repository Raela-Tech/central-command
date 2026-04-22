// api/team-ids.js
// ONE-TIME utility — call GET /api/team-ids after deploying to discover
// your team members' Notion user IDs. Paste the IDs into api/team.js.
// Remove or restrict this route once you've captured the IDs.

const { getClient, cors } = require('./_notion');

const TASKS_DB = process.env.NOTION_TASKS_DB;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const notion = getClient();

    // Pull the first 20 pages — enough to find all assignees
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      page_size: 20,
    });

    const seen = new Map();

    for (const page of response.results) {
      const people = page.properties?.['Assignee']?.people ?? [];
      for (const person of people) {
        if (!seen.has(person.id)) {
          seen.set(person.id, {
            id:     person.id,
            name:   person.name,
            email:  person.person?.email ?? null,
          });
        }
      }
    }

    return res.status(200).json({
      users: [...seen.values()],
      instructions: 'Copy the id values into the TEAM array in api/team.js, matching by name.',
    });
  } catch (err) {
    console.error('[/api/team-ids]', err);
    return res.status(500).json({ error: err.message });
  }
};
