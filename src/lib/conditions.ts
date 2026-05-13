import type { Condition, Modifier, ToEvent, ToVariable } from 'karabiner.ts';
import { toKey } from 'karabiner.ts';

export function setVarExpr(name: string, expression: string, keyUpExpression?: string): ToEvent {
  const payload: Record<string, unknown> = { name };
  if (expression) payload.expression = expression;
  if (keyUpExpression) payload.key_up_expression = keyUpExpression;
  return { set_variable: payload as ToVariable };
}

export function exprIf(expression: string): Condition {
  return { type: "expression_if", expression } as unknown as Condition;
}

export function exprUnless(expression: string): Condition {
  return { type: "expression_unless", expression } as unknown as Condition;
}

export function ifExpression(expression: string): Condition {
  return exprIf(expression);
}

export function unlessExpression(expression: string): Condition {
  return exprUnless(expression);
}

export function toKeyCond(key: string, mods: Modifier[] = [], opts: any = {}, conditions: any[] = []): ToEvent {
  const ev = toKey(key as any, mods as any, opts);
  (ev as any).conditions = normalizeConditions(conditions);
  return ev as ToEvent;
}

export function withConditions(event: ToEvent, conditions: any[] = []): ToEvent {
  const cloned: any = { ...event };
  if (conditions.length) cloned.conditions = normalizeConditions(conditions);
  return cloned as ToEvent;
}

export { withCondition } from 'karabiner.ts';

function normalizeConditions(conditions: any[]): any[] {
  return conditions.map((cond) =>
    cond && typeof cond.build === 'function' ? cond.build() : cond,
  );
}
