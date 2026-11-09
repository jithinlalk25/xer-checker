import type { Activity, Link, Loop } from './types.ts';

/**
 * Finds loops: groups of 2 or more activities that can each reach every other through
 * valid links inside the file (strongly connected components, Tarjan's algorithm).
 * Iterative, so very long chains of links can't overflow the call stack.
 */
export function findLoops(activities: ReadonlyMap<string, Activity>, links: readonly Link[]): Loop[] {
  const next = new Map<string, string[]>();
  for (const link of links) {
    if (!link.pred || !link.succ) continue;
    const list = next.get(link.pred.taskId);
    if (list) list.push(link.succ.taskId);
    else next.set(link.pred.taskId, [link.succ.taskId]);
  }

  const order = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const loops: Loop[] = [];
  let counter = 0;

  const visit = (id: string) => {
    order.set(id, counter);
    low.set(id, counter);
    counter++;
    stack.push(id);
    onStack.add(id);
  };

  for (const start of activities.keys()) {
    if (order.has(start)) continue;
    visit(start);
    const work: { id: string; edge: number }[] = [{ id: start, edge: 0 }];

    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const targets = next.get(frame.id) ?? [];
      if (frame.edge < targets.length) {
        const target = targets[frame.edge]!;
        frame.edge++;
        if (!order.has(target)) {
          visit(target);
          work.push({ id: target, edge: 0 });
        } else if (onStack.has(target)) {
          low.set(frame.id, Math.min(low.get(frame.id)!, order.get(target)!));
        }
        continue;
      }

      work.pop();
      const parent = work[work.length - 1];
      if (parent) low.set(parent.id, Math.min(low.get(parent.id)!, low.get(frame.id)!));

      if (low.get(frame.id) === order.get(frame.id)) {
        const members: Activity[] = [];
        let id: string | undefined;
        do {
          id = stack.pop()!;
          onStack.delete(id);
          const activity = activities.get(id);
          if (activity) members.push(activity);
        } while (id !== frame.id);
        if (members.length >= 2) {
          loops.push({ activities: members.sort((x, y) => x.line - y.line) });
        }
      }
    }
  }

  return loops.sort((x, y) => (x.activities[0]?.line ?? 0) - (y.activities[0]?.line ?? 0));
}
