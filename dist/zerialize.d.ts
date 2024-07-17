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
  SzEffect,
  SzCatch,
  SzReadonly,
  SzType,
  SzUnknown,
  SzRef,
} from "./types.js";
import { ZodTypes, ZTypeName } from "./zod-types.js";
export declare const PRIMITIVES: {
  readonly ZodString: "string";
  readonly ZodNumber: "number";
  readonly ZodBoolean: "boolean";
  readonly ZodNaN: "nan";
  readonly ZodBigInt: "bigInt";
  readonly ZodDate: "date";
  readonly ZodUndefined: "undefined";
  readonly ZodNull: "null";
  readonly ZodAny: "any";
  readonly ZodUnknown: "unknown";
  readonly ZodNever: "never";
  readonly ZodVoid: "void";
  readonly ZodSymbol: "symbol";
};
export type PrimitiveMap = typeof PRIMITIVES;
type IsZodPrimitive<T extends ZodTypes> =
  ZTypeName<T> extends keyof PrimitiveMap ? any : never;
export type Zerialize<T extends ZodTypes> =
  T extends z.ZodOptional<infer I>
    ? Zerialize<I> & SzOptional
    : T extends z.ZodNullable<infer I>
      ? Zerialize<I> & SzNullable
      : T extends z.ZodDefault<infer I>
        ? Zerialize<I> & SzDefault<I["_type"]>
        : T extends z.ZodReadonly<infer I>
          ? Zerialize<I> & SzReadonly
          : T extends IsZodPrimitive<T>
            ? {
                type: PrimitiveMap[ZTypeName<T>];
              }
            : T extends z.ZodLiteral<infer T>
              ? SzLiteral<T>
              : T extends z.ZodTuple<infer Items>
                ? {
                    [Index in keyof Items]: Zerialize<Items[Index]>;
                  } extends infer SzItems extends [SzType, ...SzType[]] | []
                  ? SzTuple<SzItems>
                  : SzType
                : T extends z.ZodSet<infer T>
                  ? SzSet<Zerialize<T>>
                  : T extends z.ZodArray<infer T>
                    ? SzArray<Zerialize<T>>
                    : T extends z.ZodObject<infer Properties>
                      ? SzObject<{
                          [Property in keyof Properties]: Zerialize<
                            Properties[Property]
                          >;
                        }>
                      : T extends z.ZodRecord<infer Key, infer Value>
                        ? SzRecord<Zerialize<Key>, Zerialize<Value>>
                        : T extends z.ZodMap<infer Key, infer Value>
                          ? SzMap<Zerialize<Key>, Zerialize<Value>>
                          : T extends z.ZodEnum<infer Values>
                            ? SzEnum<Values>
                            : T extends z.ZodNativeEnum<infer _Values>
                              ? SzUnknown
                              : T extends z.ZodUnion<infer Options>
                                ? {
                                    [Index in keyof Options]: Zerialize<
                                      Options[Index]
                                    >;
                                  } extends infer SzOptions extends [
                                    SzType,
                                    ...SzType[],
                                  ]
                                  ? SzUnion<SzOptions>
                                  : SzType
                                : T extends z.ZodDiscriminatedUnion<
                                      infer Discriminator,
                                      infer Options
                                    >
                                  ? SzDiscriminatedUnion<
                                      Discriminator,
                                      {
                                        [Index in keyof Options]: Zerialize<
                                          Options[Index]
                                        >;
                                      }
                                    >
                                  : T extends z.ZodIntersection<
                                        infer L,
                                        infer R
                                      >
                                    ? SzIntersection<Zerialize<L>, Zerialize<R>>
                                    : T extends z.ZodFunction<
                                          infer Args,
                                          infer Return
                                        >
                                      ? Zerialize<Args> extends infer SzArgs extends
                                          SzTuple
                                        ? SzFunction<SzArgs, Zerialize<Return>>
                                        : SzType
                                      : T extends z.ZodPromise<infer Value>
                                        ? SzPromise<Zerialize<Value>>
                                        : T extends z.ZodCatch<infer T>
                                          ? SzCatch<Zerialize<T>>
                                          : T extends z.ZodEffects<infer T>
                                            ? SzEffect<Zerialize<T>>
                                            : T extends z.ZodLazy<infer T>
                                              ? Zerialize<T>
                                              : T extends z.ZodBranded<
                                                    infer T,
                                                    infer _Brand
                                                  >
                                                ? Zerialize<T>
                                                : T extends z.ZodPipeline<
                                                      infer _In,
                                                      infer Out
                                                    >
                                                  ? Zerialize<Out>
                                                  : T extends z.ZodCatch<
                                                        infer Inner
                                                      >
                                                    ? Zerialize<Inner>
                                                    : SzType;
type ZerializerOptions = {
  superRefinements?: {
    [key: string]: (value: any, ctx: z.RefinementCtx) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (
      value: any,
      ctx: z.RefinementCtx,
    ) => Promise<unknown> | unknown;
  };
  preprocesses?: {
    [key: string]: (value: any, ctx: z.RefinementCtx) => unknown;
  };
  currentPath: string[];
  seenObjects: WeakMap<z.ZodTypeDef, string>;
};
export declare function zerializeRefs<T extends ZodTypes>(
  schema: T,
  opts: ZerializerOptions,
  wrapReferences?: boolean,
): Zerialize<T> | SzRef;
export declare function zerialize<T extends ZodTypes>(
  schema: T,
  opts?: Partial<ZerializerOptions>,
): Zerialize<T>;
export {};
