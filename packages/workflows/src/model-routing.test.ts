import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'bun:test';

const workflowRoot = resolve(import.meta.dir, '../../../.archon/workflows/sdlc');

function yamlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? yamlFiles(path) : entry.name.endsWith('.yaml') ? [path] : [];
  });
}

type WorkflowNode = {
  id: string;
  command?: string;
  prompt?: string;
  loop?: unknown;
  loop_group?: { nodes: WorkflowNode[] };
  model?: string;
  effort?: string;
  model_guard?: { ref: string; provider: string; model: string; effort: string };
};

function visit(nodes: WorkflowNode[], callback: (node: WorkflowNode) => void): void {
  for (const node of nodes) {
    const ai = node.command !== undefined || node.prompt !== undefined || node.loop !== undefined;
    if (ai) callback(node);
    if (node.loop_group) visit(node.loop_group.nodes, callback);
  }
}

describe('SDLC model routing', () => {
  test('every model-using node has an explicit approved role route and no Astra/tier fallback', () => {
    const files = yamlFiles(workflowRoot);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const workflow = Bun.YAML.parse(readFileSync(file, 'utf8')) as {
        model?: string;
        model_policy?: { require_node_guards?: boolean };
        nodes?: WorkflowNode[];
      };
      const aiNodes: WorkflowNode[] = [];
      visit(workflow.nodes ?? [], node => aiNodes.push(node));

      if (aiNodes.length > 0) {
        expect(workflow.model_policy, file).toEqual({ require_node_guards: true });
        expect(workflow.model, file).toBeUndefined();
      }

      for (const node of aiNodes) {
        const planner = file.endsWith('plan/archon-plan-block.yaml') && node.id === 'plan';
        const expected = planner
          ? {
              ref: '@imarvin-planning',
              provider: 'codex',
              model: 'gpt-6.1-sol',
              effort: 'medium',
            }
          : {
              ref: '@imarvin-luna-high',
              provider: 'codex',
              model: 'gpt-6-luna',
              effort: 'high',
            };
        expect(node.model, `${file}#${node.id}`).toBe(expected.ref);
        expect(node.effort, `${file}#${node.id}`).toBe(expected.effort);
        expect(node.model_guard, `${file}#${node.id}`).toEqual(expected);
        expect(node.model, `${file}#${node.id}`).not.toMatch(/astra|^(small|medium|large)$/i);
      }

      const visitDeterministic = (nodes: WorkflowNode[]) => {
        for (const node of nodes) {
          const ai =
            node.command !== undefined || node.prompt !== undefined || node.loop !== undefined;
          if (!ai) {
            expect(node.model, `${file}#${node.id}`).toBeUndefined();
            expect(node.model_guard, `${file}#${node.id}`).toBeUndefined();
          }
          if (node.loop_group) visitDeterministic(node.loop_group.nodes);
        }
      };
      visitDeterministic(workflow.nodes ?? []);
    }
  });
});
