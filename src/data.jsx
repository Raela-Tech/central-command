// data.jsx — constants and static reference data only.
// MY_TASKS, WAITING_ON, TEAM are no longer defined here —
// they come from useNotion() which fetches /api/tasks, /api/team, /api/waiting.
// INTAKE_SAMPLE and INTAKE_SUGGESTIONS remain as UX placeholders in the Intake tab.

// Your five work categories — must match the exact values in your Notion Work Category field.
// Update these if the Notion select options differ.
const CATEGORIES = [
  'Foundational Object',
  'Integration / Pipeline',
  'Workshop / UI',
  'Admin / Coordination',
  'POC / Exploration',
];

// Intake tab — sample placeholder text shown before the user pastes anything
const INTAKE_SAMPLE = `Paste an email, Slack message, meeting note, or spec here.
Claude will read it and suggest tasks to add to your queue.
Nothing gets written to Notion — you approve what you want, then copy the list.`;

// Intake suggestions are generated live by the Claude API call in IntakeTab.
// This empty array is the initial state.
const INTAKE_SUGGESTIONS = [];

Object.assign(window, {
  CATEGORIES,
  INTAKE_SAMPLE,
  INTAKE_SUGGESTIONS,
});
