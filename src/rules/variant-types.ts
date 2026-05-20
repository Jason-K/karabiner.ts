/**
 * Base type for conditional variants used across different rule types.
 * Provides a common structure for condition-based rule variants.
 */

export type AppCondition = {
  app: string;
  unless?: boolean;
};

export type VariableCondition = {
  name: string;
  match: "if" | "unless";
  value: string | number;
};

/**
 * Unified condition type used across tap-hold and action rules.
 * Enables consistency when specifying when a variant applies.
 */
export type ConditionalVariantCondition = AppCondition | VariableCondition;

/**
 * Base interface for variants that support conditional application.
 * Implemented by ConditionalActionVariant, TapHoldVariantMapping, etc.
 */
export interface ConditionalVariantBase {
  when?: ConditionalVariantCondition | ConditionalVariantCondition[];
  description: string;
}
