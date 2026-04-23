// api/_notion.js
// Shared utilities for all Notion API routes.
// Imported by /api/tasks.js, /api/team.js, /api/waiting.js

const { Client } = require('@notionhq/client');

const TASKS_DB = process.env.NOTION_TASKS_DB;

// Statuses that mean "this task is active and should appear in the app"
const ACTIVE_STATUSES = new Set([
  'Backlog',
  'Not Started',
  'Planning',
  'In Progress',
  'Blocked',
  'On Hold',
  'In Testing',
]);

// Map Notion priority names to the three tiers the app uses.
// "Low" is real data but not surfaced as a priority tier in the UI —
// it falls through to Medium so it still appears rather than disappearing.
const PRIORITY_MAP = {
  Critical: 'Critical',
  High:     'High',
  Medium:   'Medium',
  Low:      'Medium',
};

function getClient() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN environment variable is not set');
  }
  return new Client({ auth: process.env.NOTION_TOKEN });
}

// Pull a plain string from a Notion property safely
function str(prop) {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':
      return prop.title?.map(t => t.plain_text).join('') ?? '';
    case 'rich_text':
      return prop.rich_text?.map(t => t.plain_text).join('') ?? '';
    case 'select':
      return prop.select?.name ?? '';
    case 'status':
      return prop.status?.name ?? '';
    case 'date':
      return prop.date?.start ?? '';
    case 'people':
      return prop.people?.map(p => p.name).join(', ') ?? '';
    default:
      return '';
  }
}

// Pull the first person ID from a people property
function personId(prop) {
  if (!prop || prop.type !== 'people') return null;
  return prop.people?.[0]?.id ?? null;
}

// Relative due label — "today", "tomorrow", day name, or date string
function dueLabel(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.round((d - now) / 86400000);
  if (diff <= 0)  return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 6)  return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// How old is this task?
function ageLabel(createdStr) {
  if (!createdStr) return '';
  const diff = Date.now() - new Date(createdStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86400000);
  if (d < 7)  return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

// Normalize a raw Notion page object into the shape FlintApp expects
function normalizePage(page) {
  const p = page.properties;
  const status = str(p['Status']);
  const rawPriority = str(p['Priority']);

  return {
    id:         page.id,
    title:      str(p['Name']),
    priority:   PRIORITY_MAP[rawPriority] ?? 'Medium',
    rawPriority,
    status,
    category:   str(p['Work Category']),
    due:        dueLabel(str(p['Target Date'])),
    age:        ageLabel(page.created_time),
    notes:      str(p['Notes']),
    blockedBy:  str(p['Blocked By']),
    assigneeName: str(p['Assigned To']),
  };
}

// Query the Tasks DB with an optional extra filter.
// Always excludes Done + Archived.
async function queryTasks(notion, extraFilter = null) {
  const statusFilter = {
    or: [...ACTIVE_STATUSES].map(name => ({
      property: 'Status',
      status: { equals: name },
    })),
  };

  const filter = extraFilter
    ? { and: [statusFilter, extraFilter] }
    : statusFilter;

  const results = [];
  let cursor;

  do {
    const res = await notion.databases.query({
      database_id: TASKS_DB,
      filter,
      sorts: [
        { property: 'Priority', direction: 'descending' },
        { property: 'Target Date', direction: 'ascending' },
      ],
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    results.push(...res.results.map(normalizePage));
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return results;
}

// CORS headers — same on every route
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
}

module.exports = { getClient, queryTasks, cors };
