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
  SzType,
  SzRef,
  SzString,
  SzNumber,
  SzBoolean,
  SzBigInt,
  SzNaN,
  SzDate,
  SzAny,
  SzNever,
  SzNull,
  SzUndefined,
  SzUnknown,
  SzVoid,
} from "./types";
import { ZodTypes } from "./zod-types";

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
type OmitKey<T, K> = DistributiveOmit<T, keyof K>;

// Types must match the exported dezerialize function's implementation
export type Dezerialize<T extends SzType> =
  // Modifier types
  T extends SzOptional
    ? Dezerialize<OmitKey<T, SzOptional>> extends infer I
      ? I extends ZodTypes
        ? z.ZodOptional<I>
        : never
      : never
    : T extends SzNullable
    ? Dezerialize<OmitKey<T, SzNullable>> extends infer I
      ? I extends ZodTypes
        ? z.ZodNullable<I>
        : never
      : never
    : T extends SzDefault<any>
    ? Dezerialize<OmitKey<T, SzDefault<any>>> extends infer I
      ? I extends ZodTypes
        ? z.ZodDefault<I>
        : never
      : never // Primitives
    : T extends SzString
    ? z.ZodString
    : T extends SzNumber
    ? z.ZodNumber
    : T extends SzBoolean
    ? z.ZodBoolean
    : T extends SzBigInt
    ? z.ZodBigInt
    : T extends SzNaN
    ? z.ZodNaN
    : T extends SzDate
    ? z.ZodDate
    : T extends SzUndefined
    ? z.ZodUndefined
    : T extends SzNull
    ? z.ZodNull
    : T extends SzAny
    ? z.ZodAny
    : T extends SzUnknown
    ? z.ZodUnknown
    : T extends SzNever
    ? z.ZodNever
    : T extends SzVoid
    ? z.ZodVoid
    : T extends SzLiteral<infer Value>
    ? z.ZodLiteral<Value> // List Collections
    : T extends SzTuple<infer _Items>
    ? z.ZodTuple<any> //DezerializeArray<Items>>
    : T extends SzSet<infer Value>
    ? z.ZodSet<Dezerialize<Value>>
    : T extends SzArray<infer Element>
    ? z.ZodArray<Dezerialize<Element>> // Key/Value Collections
    : T extends SzObject<infer Properties>
    ? z.ZodObject<{
        [Property in keyof Properties]: Dezerialize<Properties[Property]>;
      }>
    : T extends SzRecord<infer Key, infer Value>
    ? z.ZodRecord<Dezerialize<Key>, Dezerialize<Value>>
    : T extends SzMap<infer Key, infer Value>
    ? z.ZodMap<Dezerialize<Key>, Dezerialize<Value>> // Enum
    : T extends SzEnum<infer Values>
    ? z.ZodEnum<Values> // Union/Intersection
    : T extends SzUnion<infer _Options>
    ? z.ZodUnion<any>
    : T extends SzDiscriminatedUnion<infer Discriminator, infer _Options>
    ? z.ZodDiscriminatedUnion<Discriminator, any>
    : T extends SzIntersection<infer L, infer R>
    ? z.ZodIntersection<Dezerialize<L>, Dezerialize<R>> // Specials
    : T extends SzFunction<infer Args, infer Return>
    ? z.ZodFunction<Dezerialize<Args>, Dezerialize<Return>>
    : T extends SzPromise<infer Value>
    ? z.ZodPromise<Dezerialize<Value>>
    : unknown;

type StateObject = {path: string, pathMap: Map<string, z.ZodObject<any>>, keyMap: Map<string, string>}

type DezerializersMap = {
  [T in SzType["type"]]: (shape: Extract<SzType, { type: T }>, state?: StateObject) => ZodTypes; //Dezerialize<Extract<SzType, { type: T }>>;
};
const dezerializers = {
  number: (shape) => {
    let n = z.number();
    if (shape.min !== undefined) {
      n = shape.minInclusive ? n.min(shape.min) : n.gt(shape.min);
    }
    if (shape.max !== undefined) {
      n = shape.maxInclusive ? n.max(shape.max) : n.lt(shape.max);
    }
    if (shape.multipleOf !== undefined) {
      n = n.multipleOf(shape.multipleOf);
    }
    if (shape.int) {
      n = n.int();
    }
    if (shape.finite) {
      n = n.finite();
    }
    return n;
  },
  string: (shape) => {
    let s = z.string();
    if (shape.min !== undefined) {
      s = s.min(shape.min);
    }
    if (shape.max !== undefined) {
      s = s.max(shape.max);
    }
    if (shape.length !== undefined) {
      s = s.length(shape.length);
    }
    if (shape.startsWith !== undefined) {
      s = s.startsWith(shape.startsWith);
    }
    if (shape.endsWith !== undefined) {
      s = s.endsWith(shape.endsWith);
    }
    if ("includes" in shape) {
      s = s.includes(shape.includes, { position: shape.position });
    }
    if ("regex" in shape) {
      s = s.regex(new RegExp(shape.regex, shape.flags));
    }
    if ("kind" in shape) {
      if (shape.kind == "ip") {
        s = s.ip({ version: shape.version });
      } else if (shape.kind == "datetime") {
        s = s.datetime({ offset: shape.offset, precision: shape.precision });
      } else {
        s = s[shape.kind]();
      }
    }

    return s;
  },
  boolean: () => z.boolean(),
  nan: () => z.nan(),
  bigInt: (shape) => {
    let i = z.bigint();
    if (shape.min !== undefined) {
      i = shape.minInclusive ? i.min(shape.min) : i.gt(shape.min);
    }
    if (shape.max !== undefined) {
      i = shape.maxInclusive ? i.max(shape.max) : i.lt(shape.max);
    }
    if (shape.multipleOf !== undefined) {
      i = i.multipleOf(shape.multipleOf);
    }
    return i;
  },
  date: (shape) => {
    let i = z.date();
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max));
    }
    return i;
  },
  undefined: () => z.undefined(),
  null: () => z.null(),
  any: () => z.any(),
  unknown: () => z.unknown(),
  never: () => z.never(),
  void: () => z.void(),

  literal: (shape) => z.literal(shape.value),

  tuple: ((shape: SzTuple, state: StateObject) => {
    let i = z.tuple(shape.items.map((item, idx) => {
      return dezerialize(item, {
        ...state,
        path: state.path + '/items/' + idx
      });
    }) as any);
    if (shape.rest) {
      i = i.rest(dezerialize(shape.rest, {
        ...state,
        path: state.path + '/rest'
      }) as any);
    }
    return i;
  }) as any,
  set: ((shape: SzSet, state: StateObject) => {
    let i = z.set(dezerialize(shape.value, {
      ...state,
      path: state.path + '/value'
    }));
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize);
    }
    return i;
  }) as any,
  array: ((shape: SzArray, state: StateObject) => {
    let i = z.array(dezerialize(shape.element, {
      ...state,
      path: state.path + '/element'
    }));
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength);
    }
    return i;
  }) as any,

  object: ((shape: SzObject, state: StateObject) => {
    const {path} = state;

    const obj = state.pathMap.has(path)
      ? state.pathMap.get(path) as z.ZodObject<any>
      : z.object({});

    let extended = obj.extend(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]): any => {
          const val = value as SzType | SzRef;
          if ('$ref' in val) {
            if (!state.pathMap.has(val.$ref)) {
              // Save current object to extend with main properties later
              state.pathMap.set(val.$ref, obj);
              state.keyMap.set(val.$ref, key);
              return null;
            }
            const o = state.pathMap.get(val.$ref) as z.ZodObject<any>;
            o.extend({
              // Todo: Replace `extended` with suitable type, e.g., array
              [key]: z.lazy(() => extended),
            }) as any;
            return [key, obj];
          }

          return [
            key,
            dezerialize(value, {
              ...state,
              path: path + '/properties/' + key,
            }),
          ];
        }).filter(Boolean)
      )
    );

    const refKey = state.keyMap.get(path);
    if (refKey !== undefined) {
      extended = extended.extend({
        [refKey]: z.lazy(() => extended)
      });
    }

    state.pathMap.set(path, extended);

    return extended;
  }) as any,
  record: ((shape: SzRecord, state: StateObject) =>
    z.record(dezerialize(shape.key, {
      ...state,
      path: state.path + '/key'
    }), dezerialize(shape.value, {
      ...state,
      path: state.path + '/value'
    }))) as any,
  map: ((shape: SzMap<any, any>, state: StateObject) =>
    z.map(dezerialize(shape.key, {
      ...state,
      path: state.path + '/key'
    }), dezerialize(shape.value, {
      ...state,
      path: state.path + '/value'
    }))) as any,

  enum: ((shape: SzEnum) => z.enum(shape.values)) as any,

  union: ((shape: SzUnion, state: StateObject) =>
    z.union(shape.options.map((option, idx) => {
      return dezerialize(option, {
        ...state,
        path: state.path + '/options/' + idx
      });
    }) as any)) as any,
  discriminatedUnion: ((shape: SzDiscriminatedUnion, state: StateObject) =>
    z.discriminatedUnion(
      shape.discriminator,
      shape.options.map((option, idx) => {
        return dezerialize(option, {
          ...state,
          path: state.path + '/options/' + idx
        });
      }) as any
    )) as any,
  intersection: ((shape: SzIntersection, state: StateObject) =>
    z.intersection(dezerialize(shape.left, {
      ...state,
      path: state.path + '/left'
    }), dezerialize(shape.right, {
      ...state,
      path: state.path + '/right'
    }))) as any,

  function: ((shape: SzFunction<any, any>, state: StateObject) =>
    z.function(
      dezerialize(shape.args, {
        ...state,
        path: state.path + '/args'
      }) as any,
      dezerialize(shape.returns, {
        ...state,
        path: state.path + '/returns'
      })
    )) as any,
  promise: ((shape: SzPromise, state: StateObject) => {
    return z.promise(dezerialize(shape.value, {
      ...state,
      path: state.path + '/value'
    }));
  }) as any,
} satisfies DezerializersMap as DezerializersMap;

// Must match the exported Dezerialize types
// export function dezerialize<T extends SzType>(_shape: T): Dezerialize<T>;
export function dezerialize(shape: SzType, state: StateObject = {
  path: '', pathMap: new Map(), keyMap: new Map()
}): ZodTypes {
  if ("isOptional" in shape) {
    const { isOptional, ...rest } = shape;
    const inner = dezerialize(rest, state);
    return isOptional ? inner.optional() : inner;
  }

  if ("isNullable" in shape) {
    const { isNullable, ...rest } = shape;
    const inner = dezerialize(rest, state);
    return isNullable ? inner.nullable() : inner;
  }

  if ("defaultValue" in shape) {
    const { defaultValue, ...rest } = shape;
    const inner = dezerialize(rest, state);
    return inner.default(defaultValue);
  }

  return dezerializers[shape.type](shape as any, state);
}
