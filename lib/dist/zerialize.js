import { z } from "zod";
import { STRING_KINDS, } from "./types";
export const PRIMITIVES = {
    ZodString: "string",
    ZodNumber: "number",
    ZodBoolean: "boolean",
    ZodNaN: "nan",
    ZodBigInt: "bigInt",
    ZodDate: "date",
    ZodUndefined: "undefined",
    ZodNull: "null",
    ZodAny: "any",
    ZodUnknown: "unknown",
    ZodNever: "never",
    ZodVoid: "void",
    ZodSymbol: "symbol",
};
const s = zerializeRefs;
const zerializers = {
    ZodOptional: (def, opts) => ({
        ...s(def.innerType, opts, true),
        isOptional: true,
    }),
    ZodNullable: (def, opts) => ({
        ...s(def.innerType, opts, true),
        isNullable: true,
    }),
    ZodDefault: (def, opts) => ({
        ...s(def.innerType, opts, true),
        defaultValue: def.innerType._def.typeName === "ZodBigInt"
            ? String(def.defaultValue())
            : def.innerType._def.typeName === "ZodDate"
                ? def.defaultValue().getTime()
                : def.defaultValue(),
    }),
    ZodNumber: (def) => {
        const checks = def.checks.reduce((o, check) => ({
            ...o,
            ...(check.kind == "min"
                ? {
                    min: check.value,
                    ...(check.inclusive ? { minInclusive: true } : {}),
                }
                : check.kind == "max"
                    ? {
                        max: check.value,
                        ...(check.inclusive ? { maxInclusive: true } : {}),
                    }
                    : check.kind == "multipleOf"
                        ? { multipleOf: check.value }
                        : check.kind == "int"
                            ? { int: true }
                            : check.kind == "finite"
                                ? {
                                    finite: true,
                                    /* c8 ignore next 2 -- Guard */
                                }
                                : {}),
        }), {});
        return Object.assign({ type: "number", ...checks }, def.coerce ? { coerce: true } : {});
    },
    ZodString: (def) => {
        const checks = def.checks.reduce((o, check) => ({
            ...o,
            ...(check.kind == "min"
                ? { min: check.value }
                : check.kind == "max"
                    ? { max: check.value }
                    : check.kind == "length"
                        ? { length: check.value }
                        : check.kind == "toLowerCase"
                            ? { toLowerCase: true }
                            : check.kind == "toUpperCase"
                                ? { toUpperCase: true }
                                : check.kind == "trim"
                                    ? { trim: true }
                                    : check.kind == "startsWith"
                                        ? { startsWith: check.value }
                                        : check.kind == "endsWith"
                                            ? { endsWith: check.value }
                                            : check.kind == "includes"
                                                ? { includes: check.value, position: check.position }
                                                : check.kind == "regex"
                                                    ? {
                                                        regex: check.regex.source,
                                                        ...(check.regex.flags ? { flags: check.regex.flags } : {}),
                                                    }
                                                    : check.kind == "ip"
                                                        ? { kind: "ip", version: check.version }
                                                        : check.kind == "cidr"
                                                            ? { kind: "cidr", version: check.version }
                                                            : check.kind == "time"
                                                                ? {
                                                                    kind: "time",
                                                                    ...(typeof check.precision === "number"
                                                                        ? { precision: check.precision }
                                                                        : {}),
                                                                }
                                                                : check.kind == "datetime"
                                                                    ? {
                                                                        kind: "datetime",
                                                                        ...(check.offset ? { offset: check.offset } : {}),
                                                                        ...("local" in check && check.local
                                                                            ? { local: check.local }
                                                                            : {}),
                                                                        ...(typeof check.precision === "number"
                                                                            ? { precision: check.precision }
                                                                            : {}),
                                                                    }
                                                                    : STRING_KINDS.has(check.kind)
                                                                        ? {
                                                                            kind: check.kind,
                                                                            /* c8 ignore next 2 -- Guard */
                                                                        }
                                                                        : {}),
        }), {});
        return Object.assign({ type: "string", ...checks }, def.coerce ? { coerce: true } : {});
    },
    ZodBoolean: (def) => Object.assign({ type: "boolean" }, def.coerce ? { coerce: true } : {}),
    ZodNaN: () => ({ type: "nan" }),
    ZodSymbol: (def) => ({ type: "symbol" }),
    ZodBigInt: (def) => {
        const checks = def.checks.reduce((o, check) => ({
            ...o,
            ...(check.kind == "min"
                ? {
                    min: String(check.value),
                    ...(check.inclusive ? { minInclusive: true } : {}),
                }
                : check.kind == "max"
                    ? {
                        max: String(check.value),
                        ...(check.inclusive ? { maxInclusive: true } : {}),
                    }
                    : check.kind == "multipleOf"
                        ? {
                            multipleOf: String(check.value),
                            /* c8 ignore next 2 -- Guard */
                        }
                        : {}),
        }), {});
        return Object.assign({ type: "bigInt", ...checks }, def.coerce ? { coerce: true } : {});
    },
    ZodDate: (def) => {
        const checks = def.checks.reduce((o, check) => ({
            ...o,
            ...(check.kind == "min"
                ? { min: check.value }
                : check.kind == "max"
                    ? {
                        max: check.value,
                        /* c8 ignore next 2 -- Guard */
                    }
                    : {}),
        }), {});
        return Object.assign({ type: "date", ...checks }, def.coerce ? { coerce: true } : {});
    },
    ZodUndefined: () => ({ type: "undefined" }),
    ZodNull: () => ({ type: "null" }),
    ZodAny: () => ({ type: "any" }),
    ZodUnknown: () => ({ type: "unknown" }),
    ZodNever: () => ({ type: "never" }),
    ZodVoid: () => ({ type: "void" }),
    ZodLiteral: (def) => ({ type: "literal", value: def.value }),
    ZodTuple: (def, opts) => ({
        type: "tuple",
        items: def.items.map((item, idx) => {
            const result = s(item, {
                ...opts,
                currentPath: [...opts.currentPath, "items", String(idx)],
            });
            return result;
        }),
        ...(def.rest
            ? {
                rest: s(def.rest, {
                    ...opts,
                    currentPath: [...opts.currentPath, "rest"],
                }),
            }
            : {}),
    }),
    ZodSet: (def, opts) => ({
        type: "set",
        value: s(def.valueType, {
            ...opts,
            currentPath: [...opts.currentPath, "value"],
        }),
        ...(def.minSize === null ? {} : { minSize: def.minSize.value }),
        ...(def.maxSize === null ? {} : { maxSize: def.maxSize.value }),
    }),
    ZodArray: (def, opts) => ({
        type: "array",
        element: s(def.type, {
            ...opts,
            currentPath: [...opts.currentPath, "element"],
        }),
        ...(def.exactLength === null
            ? {}
            : {
                minLength: def.exactLength.value,
                maxLength: def.exactLength.value,
            }),
        ...(def.minLength === null ? {} : { minLength: def.minLength.value }),
        ...(def.maxLength === null ? {} : { maxLength: def.maxLength.value }),
    }),
    ZodObject: (def, opts) => ({
        type: "object",
        ...(def.catchall._def.typeName === "ZodNever"
            ? {}
            : {
                catchall: s(def.catchall, {
                    ...opts,
                    currentPath: [...opts.currentPath, "catchall"],
                }),
            }),
        ...(def.unknownKeys === "strip"
            ? {}
            : {
                unknownKeys: def.unknownKeys,
            }),
        properties: Object.fromEntries(Object.entries(def.shape()).map(([key, schema]) => [
            key,
            s(schema, {
                ...opts,
                currentPath: [...opts.currentPath, "properties", key],
            }),
        ])),
    }),
    ZodRecord: (def, opts) => ({
        type: "record",
        key: s(def.keyType, {
            ...opts,
            currentPath: [...opts.currentPath, "key"],
        }),
        value: s(def.valueType, {
            ...opts,
            currentPath: [...opts.currentPath, "value"],
        }),
    }),
    ZodMap: (def, opts) => ({
        type: "map",
        key: s(def.keyType, {
            ...opts,
            currentPath: [...opts.currentPath, "key"],
        }),
        value: s(def.valueType, {
            ...opts,
            currentPath: [...opts.currentPath, "value"],
        }),
    }),
    ZodEnum: (def) => ({ type: "enum", values: def.values }),
    ZodNativeEnum: (def, opts) => ({
        type: "nativeEnum",
        values: def.values,
    }),
    ZodUnion: (def, opts) => ({
        type: "union",
        options: def.options.map((opt, idx) => {
            const result = s(opt, {
                ...opts,
                currentPath: [...opts.currentPath, "options", String(idx)],
            });
            return result;
        }),
    }),
    ZodDiscriminatedUnion: (def, opts) => ({
        type: "discriminatedUnion",
        discriminator: def.discriminator,
        options: def.options.map((opt, idx) => {
            const result = s(opt, {
                ...opts,
                currentPath: [...opts.currentPath, "options", String(idx)],
            });
            return result;
        }),
    }),
    ZodIntersection: (def, opts) => ({
        type: "intersection",
        left: s(def.left, {
            ...opts,
            currentPath: [...opts.currentPath, "left"],
        }),
        right: s(def.right, {
            ...opts,
            currentPath: [...opts.currentPath, "right"],
        }),
    }),
    ZodFunction: (def, opts) => ({
        type: "function",
        args: s(def.args, {
            ...opts,
            currentPath: [...opts.currentPath, "args"],
        }),
        returns: s(def.returns, {
            ...opts,
            currentPath: [...opts.currentPath, "returns"],
        }),
    }),
    ZodPromise: (def, opts) => ({
        type: "promise",
        value: s(def.type, {
            ...opts,
            currentPath: [...opts.currentPath, "value"],
        }),
    }),
    ZodLazy: (def, opts) => {
        const getter = def.getter();
        return s(getter, opts, getter.isOptional() || getter.isNullable());
    },
    ZodEffects: (def, opts) => {
        if (!("superRefinements" in opts ||
            "transforms" in opts ||
            "preprocesses" in opts)) {
            return s(def.schema, opts);
        }
        const effects = [];
        let lastDef;
        let d = def;
        do {
            lastDef = d;
            let found;
            if ("superRefinements" in opts && opts.superRefinements) {
                for (const [name, refinement] of Object.entries(opts.superRefinements)) {
                    if (d.effect.type === "refinement" &&
                        refinement === d.effect.refinement) {
                        effects.unshift({ type: "refinement", name });
                        found = true;
                        break;
                    }
                }
            }
            if (!found && "transforms" in opts && opts.transforms) {
                for (const [name, transform] of Object.entries(opts.transforms)) {
                    if (d.effect.type === "transform" &&
                        transform === d.effect.transform) {
                        effects.unshift({ type: "transform", name });
                        found = true;
                        break;
                    }
                }
            }
            if (!found && "preprocesses" in opts && opts.preprocesses) {
                for (const [name, preprocess] of Object.entries(opts.preprocesses)) {
                    if (d.effect.type === "preprocess" &&
                        preprocess === d.effect.transform) {
                        effects.unshift({ type: "preprocess", name });
                        found = true;
                        break;
                    }
                }
            }
            d = d.schema._def;
        } while (d && d.typeName === "ZodEffects");
        return {
            type: "effect",
            effects,
            inner: s(lastDef.schema, {
                ...opts,
                currentPath: [...opts.currentPath, "inner"],
            }),
        };
    },
    ZodBranded: (def, opts) => s(def.type, opts),
    ZodPipeline: (def, opts) => s(def.out, opts),
    ZodCatch: (def, opts) => {
        const catchValue = def.catchValue({
            // No errors to report, so just add an empty set
            /* c8 ignore next 3 -- Unused */
            get error() {
                return new z.ZodError([]);
            },
            // We don't have any input yet, so just provide `undefined`
            input: undefined,
        });
        return {
            type: "catch",
            value: catchValue,
            innerType: s(def.innerType, opts),
        };
    },
    ZodReadonly: (def, opts) => ({
        ...s(def.innerType, opts, true),
        readonly: true,
    }),
};
// Must match the exported Zerialize types
export function zerializeRefs(schema, opts, wrapReferences) {
    // export function zerialize(schema: ZodTypes, opts?: Partial<ZerializerOptions> | undefined): unknown {
    if (opts.seenObjects.has(schema)) {
        return wrapReferences // && schema._def.typeName !== "ZodOptional"
            ? {
                type: "union",
                options: [{ $ref: opts.seenObjects.get(schema) }],
            }
            : { $ref: opts.seenObjects.get(schema) };
    }
    const { _def: def } = schema;
    const objectPath = "#" + (opts.currentPath.length ? "/" + opts.currentPath.join("/") : "");
    opts.seenObjects.set(schema, objectPath);
    const zer = zerializers[def.typeName](def, opts);
    if (typeof def.description === "string") {
        zer.description = def.description;
    }
    return zer;
}
export function zerialize(schema, opts = {}) {
    if (!opts.currentPath) {
        opts.currentPath = [];
    }
    if (!opts.seenObjects) {
        opts.seenObjects = new WeakMap();
    }
    return zerializeRefs(schema, opts);
}
