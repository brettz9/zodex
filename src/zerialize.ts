import { z } from "zod";
import {
  SzOptional,
  SzNullable,
  SzDefault,
  SzLiteral,
  SzArray,
  SzObject,
  SzUnion,
  SzDiscriminatedUnion,
  SzIntersection,
  SzTuple,
  SzRecord,
  SzMap,
  SzSet,
  SzFunction,
  SzEnum,
  SzPromise,
  SzNumber,
  SzPrimitive,
  SzType,
  STRING_KINDS,
} from "./types";
import { ZodTypes, ZTypeName } from "./zod-types";

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
} as const satisfies Readonly<
  Partial<
    Record<Exclude<z.ZodFirstPartyTypeKind, "ZodSymbol">, SzPrimitive["type"]>
  >
>;
export type PrimitiveMap = typeof PRIMITIVES;

type IsZodPrimitive<T extends ZodTypes> =
  ZTypeName<T> extends keyof PrimitiveMap ? any : never;

// Types must match the exported zerialize function's implementation
export type Zerialize<T extends ZodTypes> =
  // Modifier types
  T extends z.ZodOptional<infer I>
    ? Zerialize<I> & SzOptional
    : T extends z.ZodNullable<infer I>
    ? Zerialize<I> & SzNullable
    : T extends z.ZodDefault<infer I>
    ? Zerialize<I> & SzDefault<I["_type"]>
    : // Primitives
    T extends z.ZodNumber
    ? SzNumber
    : T extends IsZodPrimitive<T>
    ? { type: PrimitiveMap[ZTypeName<T>] }
    : //
    T extends z.ZodLiteral<infer T>
    ? SzLiteral<T>
    : // List Collections
    T extends z.ZodTuple<infer Items>
    ? {
        [Index in keyof Items]: Zerialize<Items[Index]>;
      } extends infer SzItems extends [SzType, ...SzType[]] | []
      ? SzTuple<SzItems>
      : SzType
    : T extends z.ZodSet<infer T>
    ? SzSet<Zerialize<T>>
    : T extends z.ZodArray<infer T>
    ? SzArray<Zerialize<T>>
    : // Key/Value Collections
    T extends z.ZodObject<infer Properties>
    ? SzObject<{
        [Property in keyof Properties]: Zerialize<Properties[Property]>;
      }>
    : T extends z.ZodRecord<infer Key, infer Value>
    ? SzRecord<Zerialize<Key>, Zerialize<Value>>
    : T extends z.ZodMap<infer Key, infer Value>
    ? SzMap<Zerialize<Key>, Zerialize<Value>>
    : // Enums
    T extends z.ZodEnum<infer Values>
    ? SzEnum<Values>
    : T extends z.ZodNativeEnum<infer _Values>
    ? { type: "unknown" }
    : // Union/Intersection
    T extends z.ZodUnion<infer Options>
    ? {
        [Index in keyof Options]: Zerialize<Options[Index]>;
      } extends infer SzOptions extends [SzType, ...SzType[]]
      ? SzUnion<SzOptions>
      : SzType
    : T extends z.ZodDiscriminatedUnion<infer Discriminator, infer Options>
    ? SzDiscriminatedUnion<
        Discriminator,
        {
          [Index in keyof Options]: Zerialize<Options[Index]>;
        }
      >
    : T extends z.ZodIntersection<infer L, infer R>
    ? SzIntersection<Zerialize<L>, Zerialize<R>>
    : // Specials
    T extends z.ZodFunction<infer Args, infer Return>
    ? Zerialize<Args> extends infer SzArgs extends SzTuple
      ? SzFunction<SzArgs, Zerialize<Return>>
      : SzType
    : T extends z.ZodPromise<infer Value>
    ? SzPromise<Zerialize<Value>>
    : // Unserializable types, fallback to serializing inner type
    T extends z.ZodLazy<infer T>
    ? Zerialize<T>
    : T extends z.ZodEffects<infer T>
    ? Zerialize<T>
    : T extends z.ZodBranded<infer T, infer _Brand>
    ? Zerialize<T>
    : T extends z.ZodPipeline<infer _In, infer Out>
    ? Zerialize<Out>
    : T extends z.ZodCatch<infer Inner>
    ? Zerialize<Inner>
    : SzType;

type ZodTypeMap = {
  [Key in ZTypeName<ZodTypes>]: Extract<ZodTypes, { _def: { typeName: Key } }>;
};
type StateObject = {
  paths: string[];
  pathMap: Map<any, string[]>;
};

type ZerializersMap = {
  [Key in ZTypeName<ZodTypes>]: (
    def: ZodTypeMap[Key]["_def"],
    state: StateObject
  ) => any; //Zerialize<ZodTypeMap[Key]>;
};

const s = zerialize as any;
const zerializers = {
  ZodOptional: (def, state) => ({ ...s(def.innerType, state), isOptional: true }),
  ZodNullable: (def, state) => ({ ...s(def.innerType, state), isNullable: true }),
  ZodDefault: (def, state) => ({
    ...s(def.innerType, state),
    defaultValue: def.defaultValue(),
  }),

  ZodNumber: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
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
      }),
      {}
    );
    return { type: "number", ...checks };
  },
  ZodString: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? { min: check.value }
          : check.kind == "max"
          ? { max: check.value }
          : check.kind == "length"
          ? { length: check.value }
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
          : check.kind == "datetime"
          ? {
              kind: "datetime",
              ...(check.offset ? { offset: check.offset } : {}),
              ...(typeof check.precision === "number"
                ? { precision: check.precision }
                : {}),
            }
          : STRING_KINDS.has(check.kind as any)
          ? {
              kind: check.kind,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return { type: "string", ...checks };
  },
  ZodBoolean: () => ({ type: "boolean" }),
  ZodNaN: () => ({ type: "nan" }),
  ZodBigInt: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
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
          ? {
              multipleOf: check.value,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return { type: "bigInt", ...checks };
  },
  ZodDate: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? { min: check.value }
          : check.kind == "max"
          ? {
              max: check.value,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return { type: "date", ...checks };
  },
  ZodUndefined: () => ({ type: "undefined" }),
  ZodNull: () => ({ type: "null" }),
  ZodAny: () => ({ type: "any" }),
  ZodUnknown: () => ({ type: "unknown" }),
  ZodNever: () => ({ type: "never" }),
  ZodVoid: () => ({ type: "void" }),

  ZodLiteral: (def) => ({ type: "literal", value: def.value }),

  ZodTuple: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    const restPaths = [...state.paths];
    state.paths.push("items");
    return {
      type: "tuple",
      items: def.items.map((item: any, idx: number) => {
        return zerialize(item, {
          ...state,
          paths: [...state.paths, String(idx)],
        });
      }),
      ...(def.rest
        ? {
            rest: zerialize(def.rest, {
              ...state,
              paths: [...restPaths, "rest"],
            }),
          }
        : {}),
    };
  },
  ZodSet: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("value");
    return {
      type: "set",
      value: s(def.valueType, state),
      ...(def.minSize === null ? {} : { minSize: def.minSize.value }),
      ...(def.maxSize === null ? {} : { maxSize: def.maxSize.value }),
    };
  },
  ZodArray: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("element");

    return {
      type: "array",
      element: s(def.type, state),

      ...(def.exactLength === null
        ? {}
        : {
            minLength: def.exactLength.value,
            maxLength: def.exactLength.value,
          }),
      ...(def.minLength === null ? {} : { minLength: def.minLength.value }),
      ...(def.maxLength === null ? {} : { maxLength: def.maxLength.value }),
    };
  },

  ZodObject: (def, state) => {
    if (state.pathMap.has(def)) {
      return {
        $ref: "/" + (state.pathMap.get(def) as string[]).join("/"),
      };
    }
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("properties");

    return {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(def.shape()).map(([key, value]) => {
          return [
            key,
            s(value as ZodTypes, {
              ...state,
              paths: [...state.paths, key],
            }),
          ];
        })
      ),
    };
  },
  ZodRecord: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    return {
      type: "record",
      key: zerialize(def.keyType, {
        ...state,
        paths: [...state.paths, 'key']
      }),
      value: s(def.valueType, {
        ...state,
        paths: [...state.paths, 'value']
      }),
    };
  },
  ZodMap: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    return {
      type: "map",
      key: s(def.keyType, {
        ...state,
        paths: [...state.paths, 'key']
      }),
      value: s(def.valueType, {
        ...state,
        paths: [...state.paths, 'value']
      }),
    };
  },

  ZodEnum: (def) => ({ type: "enum", values: def.values }),
  // TODO: turn into enum
  ZodNativeEnum: () => ({ type: "unknown" }),

  ZodUnion: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("options");
    return {
      type: "union",
      options: def.options.map((option, idx) => {
        return s(option, {
          ...state,
          paths: [...state.paths, idx]
        });
      }),
    };
  },
  ZodDiscriminatedUnion: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("options");
    return {
      type: "discriminatedUnion",
      discriminator: def.discriminator,
      options: def.options.map((opt, idx) => {
        return zerialize(opt, {
          ...state,
          paths: [...state.paths, String(idx)]
        });
      }),
    };
  },
  ZodIntersection: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    return {
      type: "intersection",
      left: s(def.left, {
        ...state,
        paths: [...state.paths, 'left']
      }),
      right: zerialize(def.right, {
        ...state,
        paths: [...state.paths, 'right']
      }),
    };
  },

  ZodFunction: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    return {
      type: "function",
      args: zerialize(def.args, {
        ...state,
        paths: [...state.paths, 'args']
      }),
      returns: zerialize(def.returns, {
        ...state,
        paths: [...state.paths, 'returns']
      }),
    };
  },
  ZodPromise: (def, state) => {
    state.pathMap.set(def, [...state.paths]);
    state.paths.push("value");
    return {
      type: "promise",
      value: zerialize(def.type, state),
    };
  },

  ZodLazy: (def, state) => zerialize(def.getter(), state),
  ZodEffects: (def, state) => zerialize(def.schema, state),
  ZodBranded: (def, state) => zerialize(def.type, state),
  ZodPipeline: (def, state) => zerialize(def.out, state),
  ZodCatch: (def, state) => zerialize(def.innerType, state),
} satisfies ZerializersMap as ZerializersMap;

// Must match the exported Zerialize types
// export function zerialize<T extends ZodTypes>(_schema: T, state?: StateObject): Zerialize<T> {
export function zerialize(schema: ZodTypes, state?: StateObject): unknown {
  const { _def: def } = schema;
  return zerializers[def.typeName](
    def as any,
    state ?? { paths: [], pathMap: new Map() }
  );
}
