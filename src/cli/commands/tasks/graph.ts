/**
 * Task graph operation - Visualize task dependencies
 */

import { loadAllTasks, resolveContext, isBlocked, getOpenBlockers, getTaskSummary } from '../../../core/tasks/index.js';
import type { Task } from '../../../core/tasks/index.js';

export interface TasksGraphOptions {
  rootDir: string;
  variant?: string;
  team?: string;
  json?: boolean;
}

/**
 * Build dependency tree for a task
 */
function buildDependencyLine(task: Task, allTasks: Task[], depth: number, visited: Set<string>): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '' : '└─ ';

  if (visited.has(task.id)) {
    lines.push(`${indent}${prefix}#${task.id} (circular ref)`);
    return lines;
  }
  visited.add(task.id);

  const statusIcon = task.status === 'resolved' ? '✓' : isBlocked(task, allTasks) ? '●' : '○';
  lines.push(`${indent}${prefix}[${statusIcon}] #${task.id}: ${task.subject.slice(0, 50)}`);

  // Show tasks this one blocks
  const blockedTasks = allTasks.filter((t) => t.blockedBy.includes(task.id));
  for (const blocked of blockedTasks) {
    lines.push(...buildDependencyLine(blocked, allTasks, depth + 1, new Set(visited)));
  }

  return lines;
}

/**
 * Format task graph output
 */
function formatTaskGraph(tasks: Task[], variant: string, team: string): string {
  const lines: string[] = [];

  // Header
  lines.push(`TASK DEPENDENCY GRAPH (${variant} / ${team})`);
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push('Legend: [✓] resolved  [○] open  [●] blocked');
  lines.push('');

  // Find root tasks (tasks with no blockedBy)
  const roots = tasks.filter((t) => t.blockedBy.length === 0);

  // Build graph from each root
  const visited = new Set<string>();
  for (const root of roots) {
    if (!visited.has(root.id)) {
      const treeLines = buildDependencyLine(root, tasks, 0, new Set());
      lines.push(...treeLines);
      lines.push('');
      // Mark all tasks in this tree as visited
      for (const line of treeLines) {
        const match = line.match(/#(\d+)/);
        if (match) visited.add(match[1]);
      }
    }
  }

  // Show orphan tasks (tasks that aren't roots but weren't visited)
  const orphans = tasks.filter((t) => !visited.has(t.id) && t.blockedBy.length > 0);
  if (orphans.length > 0) {
    lines.push('─'.repeat(40));
    lines.push('Orphan tasks (blockedBy non-existent tasks):');
    for (const task of orphans) {
      const statusIcon = task.status === 'resolved' ? '✓' : '○';
      lines.push(`  [${statusIcon}] #${task.id}: ${task.subject.slice(0, 50)}`);
      lines.push(`      blockedBy: ${task.blockedBy.join(', ')}`);
    }
  }

  // Summary
  lines.push('');
  lines.push('─'.repeat(60));
  const open = tasks.filter((t) => t.status === 'open');
  const blocked = open.filter((t) => isBlocked(t, tasks));
  const ready = open.filter((t) => !isBlocked(t, tasks));
  lines.push(`Total: ${tasks.length} | Open: ${open.length} | Ready: ${ready.length} | Blocked: ${blocked.length}`);

  return lines.join('\n');
}

/**
 * Graph node for JSON output
 */
interface GraphNode {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
  blocked: boolean;
  blockedBy: Array<{ id: string; status: 'open' | 'resolved' | 'unknown' }>;
  openBlockers: string[];
  blocks: string[];
  depth: number;
}

/**
 * Format task graph as JSON
 */
function formatTaskGraphJson(tasks: Task[], variant: string, team: string): string {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Build graph nodes
  const nodes: GraphNode[] = tasks.map((task) => ({
    id: task.id,
    subject: task.subject,
    status: task.status,
    blocked: isBlocked(task, tasks),
    blockedBy: task.blockedBy.map((id) => ({
      id,
      status: taskMap.get(id)?.status ?? 'unknown',
    })),
    openBlockers: getOpenBlockers(task, tasks),
    blocks: task.blocks,
    depth: calculateDepth(task, tasks, new Set()),
  }));

  // Find roots (no blockedBy) and leaves (no blocks)
  const roots = tasks.filter((t) => t.blockedBy.length === 0).map((t) => t.id);
  const leaves = tasks.filter((t) => t.blocks.length === 0).map((t) => t.id);

  // Find orphans (blockedBy non-existent tasks)
  const orphans = tasks
    .filter((t) => t.blockedBy.length > 0 && t.blockedBy.some((id) => !taskMap.has(id)))
    .map((t) => t.id);

  const summary = getTaskSummary(tasks);

  return JSON.stringify(
    {
      variant,
      team,
      nodes,
      roots,
      leaves,
      orphans,
      summary,
    },
    null,
    2
  );
}

/**
 * Calculate the depth of a task in the dependency tree
 */
function calculateDepth(task: Task, allTasks: Task[], visited: Set<string>): number {
  if (task.blockedBy.length === 0) return 0;
  if (visited.has(task.id)) return 0; // Circular reference

  visited.add(task.id);
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  let maxDepth = 0;
  for (const blockerId of task.blockedBy) {
    const blocker = taskMap.get(blockerId);
    if (blocker) {
      const depth = calculateDepth(blocker, allTasks, new Set(visited));
      maxDepth = Math.max(maxDepth, depth + 1);
    }
  }

  return maxDepth;
}

export function runTasksGraph(opts: TasksGraphOptions): void {
  const context = resolveContext({
    rootDir: opts.rootDir,
    variant: opts.variant,
    team: opts.team,
  });

  if (context.locations.length === 0) {
    console.log('No task locations found. Check variant and team settings.');
    return;
  }

  // For now, show graph for first location
  const location = context.locations[0];
  const tasks = loadAllTasks(location.tasksDir);

  if (tasks.length === 0) {
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            variant: location.variant,
            team: location.team,
            nodes: [],
            summary: { total: 0, open: 0, resolved: 0, ready: 0, blocked: 0 },
          },
          null,
          2
        )
      );
    } else {
      console.log(`No tasks found in ${location.variant} / ${location.team}`);
    }
    return;
  }

  if (opts.json) {
    console.log(formatTaskGraphJson(tasks, location.variant, location.team));
  } else {
    console.log(formatTaskGraph(tasks, location.variant, location.team));
  }
}
