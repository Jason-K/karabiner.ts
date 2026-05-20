import { rule, type Manipulator, type Rule } from "karabiner.ts";

/**
 * Generic rule factory abstraction that eliminates repetition across
 * simple-rules, conditional-tap-hold-rules, conditional-action-rules,
 * launcher-rules, etc.
 *
 * @template T The mapping configuration type
 * @param mappings Array of mapping configs to transform into rules
 * @param toManipulators Function to convert each mapping to its manipulators
 * @param toDescription Function to extract or compute the rule description for each mapping
 * @param flattenMode If true, uses flatMap() instead of map() for multiple rules per mapping
 * @returns Array of Rule instances
 */
export function buildRulesFromMappings<T>({
  mappings,
  toManipulators,
  toDescription,
  flattenMode = false,
}: {
  mappings: ReadonlyArray<T>;
  toManipulators: (mapping: T) => Manipulator | Manipulator[];
  toDescription: (mapping: T) => string;
  flattenMode?: boolean;
}): Rule[] {
  const transform = (mapping: T): Rule => {
    const manipulators = toManipulators(mapping);
    const description = toDescription(mapping);

    return rule(description).manipulators(
      Array.isArray(manipulators) ? manipulators : [manipulators],
    ) as any;
  };

  if (flattenMode) {
    // For cases where a single mapping might produce multiple rules
    // (e.g., conditional-tap-hold with variants)
    return mappings.flatMap(transform);
  }

  return mappings.map(transform);
}

/**
 * Specialized factory for mappings with variants where:
 * - ONE rule is created per mapping
 * - All variants contribute manipulators to that ONE rule
 *
 * Used for conditional-action patterns where a mapping has variants
 * that each produce manipulators (not separate rules).
 */
export function buildRulesWithVariantManipulators<T, V>({
  mappings,
  getVariants,
  toDescription,
  toManipulators,
}: {
  mappings: ReadonlyArray<T>;
  getVariants: (mapping: T) => ReadonlyArray<V>;
  toDescription: (mapping: T) => string;
  toManipulators: (mapping: T, variant: V) => Manipulator | Manipulator[];
}): Rule[] {
  return mappings.map((mapping) => {
    const variants = getVariants(mapping);
    const allManipulators = variants.flatMap((variant) => {
      const manipulators = toManipulators(mapping, variant);
      return Array.isArray(manipulators) ? manipulators : [manipulators];
    });

    return rule(toDescription(mapping))
      .manipulators(allManipulators) as any;
  });
}

/**
 * Specialized factory for mappings where:
 * - ONE rule per variant (not per mapping)
 * - Each variant becomes a separate rule
 *
 * Used for conditional-tap-hold patterns where variants define separate rules.
 */
export function buildRulesWithVariantRules<T, V>({
  mappings,
  getVariants,
  toDescription,
  toManipulators,
}: {
  mappings: ReadonlyArray<T>;
  getVariants: (mapping: T) => ReadonlyArray<V>;
  toDescription: (mapping: T, variant: V) => string;
  toManipulators: (mapping: T, variant: V) => Manipulator | Manipulator[];
}): Rule[] {
  return mappings.flatMap((mapping) =>
    getVariants(mapping).map((variant) => {
      const manipulators = toManipulators(mapping, variant);
      const description = toDescription(mapping, variant);

      return rule(description)
        .manipulators(
          Array.isArray(manipulators) ? manipulators : [manipulators],
        ) as any;
    }),
  );
}
