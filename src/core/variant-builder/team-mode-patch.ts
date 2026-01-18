export type TeamModeState = 'enabled' | 'disabled' | 'unknown';

const TODO_WRITE_MARKER = /(var|let|const)\s+[A-Za-z_$][\w$]*="TodoWrite";/;
const IS_ENABLED_FN_RE = /isEnabled\(\)\{return!([A-Za-z_$][\w$]*)\(\)\}/;

const findTodoWriteGate = (content: string): { fnName: string } | null => {
  const markerIndex = content.search(TODO_WRITE_MARKER);
  if (markerIndex === -1) return null;

  const window = content.slice(markerIndex, markerIndex + 8000);
  const isEnabledMatch = window.match(IS_ENABLED_FN_RE);
  if (!isEnabledMatch) return null;

  return { fnName: isEnabledMatch[1] };
};

const findGateDefinition = (content: string, fnName: string): RegExpMatchArray | null => {
  const fnDefRe = new RegExp(`function\\s+${fnName}\\(\\)\\{return(!0|!1)\\}`);
  return content.match(fnDefRe);
};

export const detectTeamModeState = (content: string): TeamModeState => {
  const gate = findTodoWriteGate(content);
  if (!gate) return 'unknown';

  const fnDefMatch = findGateDefinition(content, gate.fnName);
  if (!fnDefMatch) return 'unknown';

  return fnDefMatch[1] === '!0' ? 'enabled' : 'disabled';
};

export const setTeamModeEnabled = (
  content: string,
  enable: boolean
): { content: string; changed: boolean; state: TeamModeState } => {
  const gate = findTodoWriteGate(content);
  if (!gate) return { content, changed: false, state: 'unknown' };

  const fnDefRe = new RegExp(`function\\s+${gate.fnName}\\(\\)\\{return(!0|!1)\\}`);
  const match = content.match(fnDefRe);
  if (!match) return { content, changed: false, state: 'unknown' };

  const desiredLiteral = enable ? '!0' : '!1';
  const currentLiteral = match[1];
  if (currentLiteral === desiredLiteral) {
    return { content, changed: false, state: enable ? 'enabled' : 'disabled' };
  }

  const updated = content.replace(fnDefRe, `function ${gate.fnName}(){return${desiredLiteral}}`);
  return { content: updated, changed: true, state: enable ? 'enabled' : 'disabled' };
};
