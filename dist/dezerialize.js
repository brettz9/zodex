"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dezerializeRefs = dezerializeRefs;
exports.dezerialize = dezerialize;
const zod_1 = require("zod");
function checkRef(item, opts) {
  if ("$ref" in item) {
    const lazy = zod_1.z.lazy(() => zod_1.z.null());
    opts.$refs.push([lazy, item.$ref]);
    return lazy;
  }
  return false;
}
const d = dezerializeRefs;
const dezerializers = {
  number: (shape) => {
    let n = shape.coerce ? zod_1.z.coerce.number() : zod_1.z.number();
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
    let s = shape.coerce ? zod_1.z.coerce.string() : zod_1.z.string();
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
    if (shape.toLowerCase !== undefined) {
      s = s.toLowerCase();
    }
    if (shape.toUpperCase !== undefined) {
      s = s.toUpperCase();
    }
    if (shape.trim !== undefined) {
      s = s.trim();
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
        s = s.datetime({
          offset: shape.offset,
          precision: shape.precision,
          local: shape.local,
        });
      } else if (shape.kind == "time") {
        s = s.time({
          precision: shape.precision,
        });
      } else {
        s = s[shape.kind]();
      }
    }
    return s;
  },
  boolean: (shape) =>
    shape.coerce ? zod_1.z.coerce.boolean() : zod_1.z.boolean(),
  nan: () => zod_1.z.nan(),
  bigInt: (shape) => {
    let i = shape.coerce ? zod_1.z.coerce.bigint() : zod_1.z.bigint();
    if (shape.min !== undefined) {
      const min = BigInt(shape.min);
      i = shape.minInclusive ? i.min(min) : i.gt(min);
    }
    if (shape.max !== undefined) {
      const max = BigInt(shape.max);
      i = shape.maxInclusive ? i.max(max) : i.lt(max);
    }
    if (shape.multipleOf !== undefined) {
      const multipleOf = BigInt(shape.multipleOf);
      i = i.multipleOf(multipleOf);
    }
    return i;
  },
  date: (shape) => {
    let i = shape.coerce ? zod_1.z.coerce.date() : zod_1.z.date();
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max));
    }
    return i;
  },
  undefined: () => zod_1.z.undefined(),
  null: () => zod_1.z.null(),
  any: () => zod_1.z.any(),
  unknown: () => zod_1.z.unknown(),
  never: () => zod_1.z.never(),
  void: () => zod_1.z.void(),
  literal: (shape) => zod_1.z.literal(shape.value),
  symbol: () => zod_1.z.symbol(),
  tuple: (shape, opts) => {
    let i = zod_1.z.tuple(
      shape.items.map((item, idx) => {
        return (
          checkRef(item, opts) ||
          d(item, {
            ...opts,
            path: opts.path + "/items/" + idx,
          })
        );
      }),
    );
    if (shape.rest) {
      const rest =
        checkRef(shape.rest, opts) ||
        d(shape.rest, {
          ...opts,
          path: opts.path + "/rest",
        });
      i = i.rest(rest);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  set: (shape, opts) => {
    let i = zod_1.z.set(
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  array: (shape, opts) => {
    let i = zod_1.z.array(
      checkRef(shape.element, opts) ||
        d(shape.element, {
          ...opts,
          path: opts.path + "/element",
        }),
    );
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  object: (shape, opts) => {
    let i = zod_1.z.object(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]) => {
          return [
            key,
            checkRef(value, opts) ||
              d(value, {
                ...opts,
                path: opts.path + "/properties/" + key,
              }),
          ];
        }),
      ),
    );
    if (shape.catchall) {
      i = i.catchall(d(shape.catchall, opts));
    } else if (shape.unknownKeys === "strict") {
      i = i.strict();
    } else if (shape.unknownKeys === "passthrough") {
      i = i.passthrough();
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  record: (shape, opts) => {
    const i = zod_1.z.record(
      checkRef(shape.key, opts) ||
        d(shape.key, {
          ...opts,
          path: opts.path + "/key",
        }),
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  map: (shape, opts) => {
    const i = zod_1.z.map(
      checkRef(shape.key, opts) ||
        d(shape.key, {
          ...opts,
          path: opts.path + "/key",
        }),
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  nativeEnum: (shape) => zod_1.z.nativeEnum(shape.values),
  enum: (shape) => zod_1.z.enum(shape.values),
  union: (shape, opts) => {
    const i = zod_1.z.union(
      shape.options.map(
        (opt, idx) =>
          checkRef(opt, opts) ||
          d(opt, {
            ...opts,
            path: opts.path + "/options/" + idx,
          }),
      ),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  discriminatedUnion: (shape, opts) => {
    const i = zod_1.z.discriminatedUnion(
      shape.discriminator,
      shape.options.map(
        (opt, idx) =>
          checkRef(opt, opts) ||
          d(opt, {
            ...opts,
            path: opts.path + "/options/" + idx,
          }),
      ),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  intersection: (shape, opts) => {
    const i = zod_1.z.intersection(
      checkRef(shape.left, opts) ||
        d(shape.left, {
          ...opts,
          path: opts.path + "/left",
        }),
      checkRef(shape.right, opts) ||
        d(shape.right, {
          ...opts,
          path: opts.path + "/right",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  function: (shape, opts) => {
    const i = zod_1.z.function(
      checkRef(shape.args, opts) ||
        d(shape.args, {
          ...opts,
          path: opts.path + "/args",
        }),
      checkRef(shape.returns, opts) ||
        d(shape.returns, {
          ...opts,
          path: opts.path + "/returns",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  promise: (shape, opts) => {
    const i = zod_1.z.promise(
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  catch: (shape, opts) => {
    let base =
      checkRef(shape.innerType, opts) ||
      d(shape.innerType, {
        ...opts,
        path: opts.path + "/innerType",
      });
    base = base.catch(shape.value);
    opts.pathToSchema.set(opts.path, base);
    return base;
  },
  effect: (shape, opts) => {
    let base =
      checkRef(shape.inner, opts) ||
      d(shape.inner, {
        ...opts,
        path: opts.path + "/inner",
      });
    if (
      !(
        "superRefinements" in opts ||
        "transforms" in opts ||
        "preprocesses" in opts
      )
    ) {
      opts.pathToSchema.set(opts.path, base);
      return base;
    }
    for (const { name, type } of shape.effects) {
      if (type === "refinement" && opts.superRefinements?.[name]) {
        base = base.superRefine(opts.superRefinements[name]);
      } else if (type === "transform" && opts.transforms?.[name]) {
        base = base.transform(opts.transforms[name]);
      } else if (type === "preprocess" && opts.preprocesses?.[name]) {
        base = zod_1.z.preprocess(opts.preprocesses[name], base);
      }
    }
    opts.pathToSchema.set(opts.path, base);
    return base;
  },
};
// Must match the exported Dezerialize types
// export function dezerialize<T extends SzType>(shape: T, opts?: DezerializerOptions): Dezerialize<T> {
function dezerializeRefs(shape, opts) {
  if ("isOptional" in shape) {
    const { isOptional, ...rest } = shape;
    const inner = d(rest, opts);
    const result = isOptional ? inner.optional() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }
  if ("isNullable" in shape) {
    const { isNullable, ...rest } = shape;
    const inner = d(rest, opts);
    const result = isNullable ? inner.nullable() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }
  if ("defaultValue" in shape) {
    const { defaultValue, ...rest } = shape;
    const inner = d(rest, opts);
    const result = inner.default(
      shape.type === "bigInt"
        ? BigInt(defaultValue)
        : shape.type === "date"
          ? new Date(defaultValue)
          : defaultValue,
    );
    opts.pathToSchema.set(opts.path, result);
    return result;
  }
  if ("readonly" in shape) {
    const { readonly, ...rest } = shape;
    const inner = d(rest, opts);
    const result = readonly ? inner.readonly() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }
  if ("description" in shape && typeof shape.description === "string") {
    const { description, ...rest } = shape;
    const inner = d(rest, opts);
    const result = inner.describe(description);
    opts.pathToSchema.set(opts.path, result);
    return result;
  }
  return dezerializers[shape.type](shape, opts);
}
function resolvePointer(obj, pointer) {
  const tokens = pointer.split("/").slice(1);
  return tokens.reduce((acc, token) => {
    /* c8 ignore next -- Guard */
    if (acc === undefined) return acc;
    return acc[token.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, obj);
}
function dezerialize(shape, opts = {}) {
  if (!("path" in opts)) {
    opts.path = "#";
  }
  if (!("pathToSchema" in opts)) {
    opts.pathToSchema = new Map();
  }
  if (!("$refs" in opts)) {
    opts.$refs = [];
  }
  if (!("originalShape" in opts)) {
    opts.originalShape = shape;
  }
  const options = opts;
  const dez = dezerializeRefs(shape, options);
  for (const [lazy, $ref] of options.$refs) {
    lazy._def.getter = () => {
      const schema = options.pathToSchema.get($ref);
      if (schema) {
        return schema;
      }
      const obj = resolvePointer(options.originalShape, $ref);
      // Ensure we act on the same options as the main document JSON
      const dez = dezerialize(obj, options);
      options.pathToSchema.set($ref, dez);
      return dez;
    };
  }
  return dez;
}
