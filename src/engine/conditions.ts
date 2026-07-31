import type { Condition, ToVariable } from 'karabiner.ts';
import type { ToEvent } from 'karabiner.ts';

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

export { withCondition } from 'karabiner.ts';
