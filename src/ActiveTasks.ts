// Current research scope. Model weight updates may still occur weekly.
export const forecastTasks = ['daily-7', 'shift-7', 'hourly-24', 'hourly-168'];
export const retiredWeeklyTask = (task: string | null) => task === 'recovery-28' || forecastTasks.includes(task || '') ? task! : 'daily-7';
export const retiredWeeklyPanel = (_panel: string | null) => 'recent';
export const activeResult = (row: {task?: string; panel?: string}) => row.panel === 'recent' && (row.task === 'recovery-28' || forecastTasks.includes(row.task || ''));
