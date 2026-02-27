export type WorkflowDiagnosticCategory = 'data-source' | 'expression';
export type WorkflowDiagnosticLevel = 'error' | 'warn';

export interface WorkflowDiagnosticEvent {
  category: WorkflowDiagnosticCategory;
  context?: Record<string, any>;
  id: string;
  level: WorkflowDiagnosticLevel;
  message: string;
  timestamp: string;
}

const WORKFLOW_DIAGNOSTIC_STORAGE_KEY = 'workflow_form_diagnostics_v1';
const MAX_WORKFLOW_DIAGNOSTIC_COUNT = 200;

function createDiagnosticId() {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSafeStorage(): Storage | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage;
}

function toSafeSerializableValue(value: any): any {
  try {
    return JSON.parse(JSON.stringify(value, (_key, item) => {
      if (item instanceof Error) {
        return {
          message: item.message,
          name: item.name,
          stack: item.stack,
        };
      }
      if (typeof item === 'function') {
        return `[Function ${item.name || 'anonymous'}]`;
      }
      return item;
    }));
  } catch {
    return {
      raw: String(value ?? ''),
    };
  }
}

function readWorkflowDiagnosticEvents() {
  const storage = getSafeStorage();
  if (!storage) return [] as WorkflowDiagnosticEvent[];

  const raw = storage.getItem(WORKFLOW_DIAGNOSTIC_STORAGE_KEY);
  if (!raw) return [] as WorkflowDiagnosticEvent[];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as WorkflowDiagnosticEvent[] : [];
  } catch {
    return [] as WorkflowDiagnosticEvent[];
  }
}

function writeWorkflowDiagnosticEvents(events: WorkflowDiagnosticEvent[]) {
  const storage = getSafeStorage();
  if (!storage) return;

  storage.setItem(WORKFLOW_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(events));
}

export function recordWorkflowDiagnostic(
  input: Omit<WorkflowDiagnosticEvent, 'id' | 'timestamp'>,
) {
  const event: WorkflowDiagnosticEvent = {
    category: input.category,
    context: input.context ? toSafeSerializableValue(input.context) : undefined,
    id: createDiagnosticId(),
    level: input.level,
    message: String(input.message ?? ''),
    timestamp: new Date().toISOString(),
  };

  const next = [...readWorkflowDiagnosticEvents(), event];
  if (next.length > MAX_WORKFLOW_DIAGNOSTIC_COUNT) {
    next.splice(0, next.length - MAX_WORKFLOW_DIAGNOSTIC_COUNT);
  }
  writeWorkflowDiagnosticEvents(next);
}

export function getWorkflowDiagnostics() {
  return readWorkflowDiagnosticEvents();
}

export function clearWorkflowDiagnostics() {
  const storage = getSafeStorage();
  if (!storage) return;
  storage.removeItem(WORKFLOW_DIAGNOSTIC_STORAGE_KEY);
}
