// dezerialize.ts
import { z } from "zod";
function checkRef(item, opts) {
  if ("$ref" in item) {
    const lazy = z.lazy(() => z.null());
    opts.$refs.push([lazy, item.$ref]);
    return lazy;
  }
  return false;
}
var d = dezerializeRefs;
var dezerializers = {
  number: (shape) => {
    let n = shape.coerce ? z.coerce.number() : z.number();
    if (shape.min !== void 0) {
      n = shape.minInclusive ? n.min(shape.min) : n.gt(shape.min);
    }
    if (shape.max !== void 0) {
      n = shape.maxInclusive ? n.max(shape.max) : n.lt(shape.max);
    }
    if (shape.multipleOf !== void 0) {
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
    let s2 = shape.coerce ? z.coerce.string() : z.string();
    if (shape.min !== void 0) {
      s2 = s2.min(shape.min);
    }
    if (shape.max !== void 0) {
      s2 = s2.max(shape.max);
    }
    if (shape.length !== void 0) {
      s2 = s2.length(shape.length);
    }
    if (shape.startsWith !== void 0) {
      s2 = s2.startsWith(shape.startsWith);
    }
    if (shape.endsWith !== void 0) {
      s2 = s2.endsWith(shape.endsWith);
    }
    if (shape.toLowerCase !== void 0) {
      s2 = s2.toLowerCase();
    }
    if (shape.toUpperCase !== void 0) {
      s2 = s2.toUpperCase();
    }
    if (shape.trim !== void 0) {
      s2 = s2.trim();
    }
    if ("includes" in shape) {
      s2 = s2.includes(shape.includes, { position: shape.position });
    }
    if ("regex" in shape) {
      s2 = s2.regex(new RegExp(shape.regex, shape.flags));
    }
    if ("kind" in shape) {
      if (shape.kind == "ip") {
        s2 = s2.ip({ version: shape.version });
      } else if (shape.kind == "cidr") {
        s2 = s2.cidr({ version: shape.version });
      } else if (shape.kind == "datetime") {
        s2 = s2.datetime({
          offset: shape.offset,
          precision: shape.precision,
          local: shape.local
        });
      } else if (shape.kind == "time") {
        s2 = s2.time({
          precision: shape.precision
        });
      } else {
        s2 = s2[shape.kind]();
      }
    }
    return s2;
  },
  boolean: (shape) => shape.coerce ? z.coerce.boolean() : z.boolean(),
  nan: () => z.nan(),
  bigInt: (shape) => {
    let i = shape.coerce ? z.coerce.bigint() : z.bigint();
    if (shape.min !== void 0) {
      const min = BigInt(shape.min);
      i = shape.minInclusive ? i.min(min) : i.gt(min);
    }
    if (shape.max !== void 0) {
      const max = BigInt(shape.max);
      i = shape.maxInclusive ? i.max(max) : i.lt(max);
    }
    if (shape.multipleOf !== void 0) {
      const multipleOf = BigInt(shape.multipleOf);
      i = i.multipleOf(multipleOf);
    }
    return i;
  },
  date: (shape) => {
    let i = shape.coerce ? z.coerce.date() : z.date();
    if (shape.min !== void 0) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== void 0) {
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
  symbol: () => z.symbol(),
  tuple: (shape, opts) => {
    let i = z.tuple(
      shape.items.map((item, idx) => {
        return checkRef(item, opts) || d(item, {
          ...opts,
          path: opts.path + "/items/" + idx
        });
      })
    );
    if (shape.rest) {
      const rest = checkRef(shape.rest, opts) || d(shape.rest, {
        ...opts,
        path: opts.path + "/rest"
      });
      i = i.rest(rest);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  set: (shape, opts) => {
    let i = z.set(
      checkRef(shape.value, opts) || d(shape.value, {
        ...opts,
        path: opts.path + "/value"
      })
    );
    if (shape.minSize !== void 0) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== void 0) {
      i = i.max(shape.maxSize);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  array: (shape, opts) => {
    let i = z.array(
      checkRef(shape.element, opts) || d(shape.element, {
        ...opts,
        path: opts.path + "/element"
      })
    );
    if (shape.minLength !== void 0) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== void 0) {
      i = i.max(shape.maxLength);
    }
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  object: (shape, opts) => {
    let i = z.object(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]) => {
          return [
            key,
            checkRef(value, opts) || d(value, {
              ...opts,
              path: opts.path + "/properties/" + key
            })
          ];
        })
      )
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
    const i = z.record(
      checkRef(shape.key, opts) || d(shape.key, {
        ...opts,
        path: opts.path + "/key"
      }),
      checkRef(shape.value, opts) || d(shape.value, {
        ...opts,
        path: opts.path + "/value"
      })
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  map: (shape, opts) => {
    const i = z.map(
      checkRef(shape.key, opts) || d(shape.key, {
        ...opts,
        path: opts.path + "/key"
      }),
      checkRef(shape.value, opts) || d(shape.value, {
        ...opts,
        path: opts.path + "/value"
      })
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  nativeEnum: (shape) => z.nativeEnum(shape.values),
  enum: (shape) => z.enum(shape.values),
  union: (shape, opts) => {
    const i = z.union(
      shape.options.map(
        (opt, idx) => checkRef(opt, opts) || d(opt, {
          ...opts,
          path: opts.path + "/options/" + idx
        })
      )
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  discriminatedUnion: (shape, opts) => {
    const i = z.discriminatedUnion(
      shape.discriminator,
      shape.options.map(
        (opt, idx) => checkRef(opt, opts) || d(opt, {
          ...opts,
          path: opts.path + "/options/" + idx
        })
      )
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  intersection: (shape, opts) => {
    const i = z.intersection(
      checkRef(shape.left, opts) || d(shape.left, {
        ...opts,
        path: opts.path + "/left"
      }),
      checkRef(shape.right, opts) || d(shape.right, {
        ...opts,
        path: opts.path + "/right"
      })
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  function: (shape, opts) => {
    const i = z.function(
      checkRef(shape.args, opts) || d(shape.args, {
        ...opts,
        path: opts.path + "/args"
      }),
      checkRef(shape.returns, opts) || d(shape.returns, {
        ...opts,
        path: opts.path + "/returns"
      })
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  promise: (shape, opts) => {
    const i = z.promise(
      checkRef(shape.value, opts) || d(shape.value, {
        ...opts,
        path: opts.path + "/value"
      })
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  },
  catch: (shape, opts) => {
    let base = checkRef(shape.innerType, opts) || d(shape.innerType, {
      ...opts,
      path: opts.path + "/innerType"
    });
    base = base.catch(shape.value);
    opts.pathToSchema.set(opts.path, base);
    return base;
  },
  effect: (shape, opts) => {
    let base = checkRef(shape.inner, opts) || d(shape.inner, {
      ...opts,
      path: opts.path + "/inner"
    });
    if (!("superRefinements" in opts || "transforms" in opts || "preprocesses" in opts)) {
      opts.pathToSchema.set(opts.path, base);
      return base;
    }
    for (const { name, type } of shape.effects) {
      if (type === "refinement" && opts.superRefinements?.[name]) {
        base = base.superRefine(opts.superRefinements[name]);
      } else if (type === "transform" && opts.transforms?.[name]) {
        base = base.transform(opts.transforms[name]);
      } else if (type === "preprocess" && opts.preprocesses?.[name]) {
        base = z.preprocess(opts.preprocesses[name], base);
      }
    }
    opts.pathToSchema.set(opts.path, base);
    return base;
  }
};
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
      shape.type === "bigInt" ? BigInt(defaultValue) : shape.type === "date" ? new Date(defaultValue) : defaultValue
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
    if (acc === void 0) return acc;
    return acc[token.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, obj);
}
function dezerialize(shape, opts = {}) {
  if (!("path" in opts)) {
    opts.path = "#";
  }
  if (!("pathToSchema" in opts)) {
    opts.pathToSchema = /* @__PURE__ */ new Map();
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
      const dez2 = dezerialize(obj, options);
      options.pathToSchema.set($ref, dez2);
      return dez2;
    };
  }
  return dez;
}

// zerialize.ts
import { z as z2 } from "zod";

// types.ts
var STRING_KINDS = /* @__PURE__ */ new Set([
  "email",
  "url",
  "emoji",
  "uuid",
  "nanoid",
  "cuid",
  "cuid2",
  "ulid",
  "date",
  "duration",
  "base64",
  "base64url"
]);

// zerialize.ts
var PRIMITIVES = {
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
  ZodSymbol: "symbol"
};
var s = zerializeRefs;
var zerializers = {
  ZodOptional: (def, opts) => ({
    ...s(def.innerType, opts, true),
    isOptional: true
  }),
  ZodNullable: (def, opts) => ({
    ...s(def.innerType, opts, true),
    isNullable: true
  }),
  ZodDefault: (def, opts) => ({
    ...s(def.innerType, opts, true),
    defaultValue: def.innerType._def.typeName === "ZodBigInt" ? String(def.defaultValue()) : def.innerType._def.typeName === "ZodDate" ? def.defaultValue().getTime() : def.defaultValue()
  }),
  ZodNumber: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...check.kind == "min" ? {
          min: check.value,
          ...check.inclusive ? { minInclusive: true } : {}
        } : check.kind == "max" ? {
          max: check.value,
          ...check.inclusive ? { maxInclusive: true } : {}
        } : check.kind == "multipleOf" ? { multipleOf: check.value } : check.kind == "int" ? { int: true } : check.kind == "finite" ? {
          finite: true
          /* c8 ignore next 2 -- Guard */
        } : {}
      }),
      {}
    );
    return Object.assign(
      { type: "number", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodString: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...check.kind == "min" ? { min: check.value } : check.kind == "max" ? { max: check.value } : check.kind == "length" ? { length: check.value } : check.kind == "toLowerCase" ? { toLowerCase: true } : check.kind == "toUpperCase" ? { toUpperCase: true } : check.kind == "trim" ? { trim: true } : check.kind == "startsWith" ? { startsWith: check.value } : check.kind == "endsWith" ? { endsWith: check.value } : check.kind == "includes" ? { includes: check.value, position: check.position } : check.kind == "regex" ? {
          regex: check.regex.source,
          ...check.regex.flags ? { flags: check.regex.flags } : {}
        } : check.kind == "ip" ? { kind: "ip", version: check.version } : check.kind == "cidr" ? { kind: "cidr", version: check.version } : check.kind == "time" ? {
          kind: "time",
          ...typeof check.precision === "number" ? { precision: check.precision } : {}
        } : check.kind == "datetime" ? {
          kind: "datetime",
          ...check.offset ? { offset: check.offset } : {},
          ..."local" in check && check.local ? { local: check.local } : {},
          ...typeof check.precision === "number" ? { precision: check.precision } : {}
        } : STRING_KINDS.has(check.kind) ? {
          kind: check.kind
          /* c8 ignore next 2 -- Guard */
        } : {}
      }),
      {}
    );
    return Object.assign(
      { type: "string", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodBoolean: (def) => Object.assign({ type: "boolean" }, def.coerce ? { coerce: true } : {}),
  ZodNaN: () => ({ type: "nan" }),
  ZodSymbol: (def) => ({ type: "symbol" }),
  ZodBigInt: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...check.kind == "min" ? {
          min: String(check.value),
          ...check.inclusive ? { minInclusive: true } : {}
        } : check.kind == "max" ? {
          max: String(check.value),
          ...check.inclusive ? { maxInclusive: true } : {}
        } : check.kind == "multipleOf" ? {
          multipleOf: String(check.value)
          /* c8 ignore next 2 -- Guard */
        } : {}
      }),
      {}
    );
    return Object.assign(
      { type: "bigInt", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodDate: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...check.kind == "min" ? { min: check.value } : check.kind == "max" ? {
          max: check.value
          /* c8 ignore next 2 -- Guard */
        } : {}
      }),
      {}
    );
    return Object.assign(
      { type: "date", ...checks },
      def.coerce ? { coerce: true } : {}
    );
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
        currentPath: [...opts.currentPath, "items", String(idx)]
      });
      return result;
    }),
    ...def.rest ? {
      rest: s(def.rest, {
        ...opts,
        currentPath: [...opts.currentPath, "rest"]
      })
    } : {}
  }),
  ZodSet: (def, opts) => ({
    type: "set",
    value: s(def.valueType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"]
    }),
    ...def.minSize === null ? {} : { minSize: def.minSize.value },
    ...def.maxSize === null ? {} : { maxSize: def.maxSize.value }
  }),
  ZodArray: (def, opts) => ({
    type: "array",
    element: s(def.type, {
      ...opts,
      currentPath: [...opts.currentPath, "element"]
    }),
    ...def.exactLength === null ? {} : {
      minLength: def.exactLength.value,
      maxLength: def.exactLength.value
    },
    ...def.minLength === null ? {} : { minLength: def.minLength.value },
    ...def.maxLength === null ? {} : { maxLength: def.maxLength.value }
  }),
  ZodObject: (def, opts) => ({
    type: "object",
    ...def.catchall._def.typeName === "ZodNever" ? {} : {
      catchall: s(def.catchall, {
        ...opts,
        currentPath: [...opts.currentPath, "catchall"]
      })
    },
    ...def.unknownKeys === "strip" ? {} : {
      unknownKeys: def.unknownKeys
    },
    properties: Object.fromEntries(
      Object.entries(def.shape()).map(([key, schema]) => [
        key,
        s(schema, {
          ...opts,
          currentPath: [...opts.currentPath, "properties", key]
        })
      ])
    )
  }),
  ZodRecord: (def, opts) => ({
    type: "record",
    key: s(def.keyType, {
      ...opts,
      currentPath: [...opts.currentPath, "key"]
    }),
    value: s(def.valueType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"]
    })
  }),
  ZodMap: (def, opts) => ({
    type: "map",
    key: s(def.keyType, {
      ...opts,
      currentPath: [...opts.currentPath, "key"]
    }),
    value: s(def.valueType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"]
    })
  }),
  ZodEnum: (def) => ({ type: "enum", values: def.values }),
  ZodNativeEnum: (def, opts) => ({
    type: "nativeEnum",
    values: def.values
  }),
  ZodUnion: (def, opts) => ({
    type: "union",
    options: def.options.map((opt, idx) => {
      const result = s(opt, {
        ...opts,
        currentPath: [...opts.currentPath, "options", String(idx)]
      });
      return result;
    })
  }),
  ZodDiscriminatedUnion: (def, opts) => ({
    type: "discriminatedUnion",
    discriminator: def.discriminator,
    options: def.options.map((opt, idx) => {
      const result = s(opt, {
        ...opts,
        currentPath: [...opts.currentPath, "options", String(idx)]
      });
      return result;
    })
  }),
  ZodIntersection: (def, opts) => ({
    type: "intersection",
    left: s(def.left, {
      ...opts,
      currentPath: [...opts.currentPath, "left"]
    }),
    right: s(def.right, {
      ...opts,
      currentPath: [...opts.currentPath, "right"]
    })
  }),
  ZodFunction: (def, opts) => ({
    type: "function",
    args: s(def.args, {
      ...opts,
      currentPath: [...opts.currentPath, "args"]
    }),
    returns: s(def.returns, {
      ...opts,
      currentPath: [...opts.currentPath, "returns"]
    })
  }),
  ZodPromise: (def, opts) => ({
    type: "promise",
    value: s(def.type, {
      ...opts,
      currentPath: [...opts.currentPath, "value"]
    })
  }),
  ZodLazy: (def, opts) => {
    const getter = def.getter();
    return s(getter, opts, getter.isOptional() || getter.isNullable());
  },
  ZodEffects: (def, opts) => {
    if (!("superRefinements" in opts || "transforms" in opts || "preprocesses" in opts)) {
      return s(def.schema, opts);
    }
    const effects = [];
    let lastDef;
    let d2 = def;
    do {
      lastDef = d2;
      let found;
      if ("superRefinements" in opts && opts.superRefinements) {
        for (const [name, refinement] of Object.entries(
          opts.superRefinements
        )) {
          if (d2.effect.type === "refinement" && refinement === d2.effect.refinement) {
            effects.unshift({ type: "refinement", name });
            found = true;
            break;
          }
        }
      }
      if (!found && "transforms" in opts && opts.transforms) {
        for (const [name, transform] of Object.entries(opts.transforms)) {
          if (d2.effect.type === "transform" && transform === d2.effect.transform) {
            effects.unshift({ type: "transform", name });
            found = true;
            break;
          }
        }
      }
      if (!found && "preprocesses" in opts && opts.preprocesses) {
        for (const [name, preprocess] of Object.entries(opts.preprocesses)) {
          if (d2.effect.type === "preprocess" && preprocess === d2.effect.transform) {
            effects.unshift({ type: "preprocess", name });
            found = true;
            break;
          }
        }
      }
      d2 = d2.schema._def;
    } while (d2 && d2.typeName === "ZodEffects");
    return {
      type: "effect",
      effects,
      inner: s(lastDef.schema, {
        ...opts,
        currentPath: [...opts.currentPath, "inner"]
      })
    };
  },
  ZodBranded: (def, opts) => s(def.type, opts),
  ZodPipeline: (def, opts) => s(def.out, opts),
  ZodCatch: (def, opts) => {
    const catchValue = def.catchValue({
      // No errors to report, so just add an empty set
      /* c8 ignore next 3 -- Unused */
      get error() {
        return new z2.ZodError([]);
      },
      // We don't have any input yet, so just provide `undefined`
      input: void 0
    });
    return {
      type: "catch",
      value: catchValue,
      innerType: s(def.innerType, opts)
    };
  },
  ZodReadonly: (def, opts) => ({
    ...s(def.innerType, opts, true),
    readonly: true
  })
};
function zerializeRefs(schema, opts, wrapReferences) {
  if (opts.seenObjects.has(schema)) {
    return wrapReferences ? {
      type: "union",
      options: [{ $ref: opts.seenObjects.get(schema) }]
    } : { $ref: opts.seenObjects.get(schema) };
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
function zerialize(schema, opts = {}) {
  if (!opts.currentPath) {
    opts.currentPath = [];
  }
  if (!opts.seenObjects) {
    opts.seenObjects = /* @__PURE__ */ new WeakMap();
  }
  return zerializeRefs(schema, opts);
}
export {
  PRIMITIVES,
  STRING_KINDS,
  dezerialize,
  dezerializeRefs,
  zerialize,
  zerializeRefs
};
