import { z } from "zod";
import {
  SzOptional,
  SzNullable,
  SzReadonly,
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
  SzNativeEnum,
  SzPromise,
  SzEffect,
  SzCatch,
  SzType,
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
  SzSymbol,
  SzUnknown,
  SzVoid,
  SzRef,
} from "./types.js";
import { ZodTypes } from "./zod-types.js";
type DezerializerOptions = {
  superRefinements?: {
    [key: string]: (
      value: unknown,
      ctx: z.RefinementCtx,
    ) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (
      value: unknown,
      ctx: z.RefinementCtx,
    ) => Promise<unknown> | unknown;
  };
  preprocesses?: {
    [key: string]: (value: unknown, ctx: z.RefinementCtx) => unknown;
  };
  path: string;
  pathToSchema: Map<string, ZodTypes>;
  $refs: [z.ZodLazy<any>, string][];
  originalShape: SzType;
};
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
type OmitKey<T, K> = DistributiveOmit<T, keyof K>;
export type Dezerialize<T extends SzType | SzRef> = T extends SzRef
  ? any
  : T extends SzOptional
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
      : T extends SzReadonly
        ? Dezerialize<OmitKey<T, SzReadonly>> extends infer I
          ? I extends ZodTypes
            ? z.ZodReadonly<I>
            : never
          : never
        : T extends SzDefault<any>
          ? Dezerialize<OmitKey<T, SzDefault<any>>> extends infer I
            ? I extends ZodTypes
              ? z.ZodDefault<I>
              : never
            : never
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
                          : T extends SzSymbol
                            ? z.ZodSymbol
                            : T extends SzAny
                              ? z.ZodAny
                              : T extends SzUnknown
                                ? z.ZodUnknown
                                : T extends SzNever
                                  ? z.ZodNever
                                  : T extends SzVoid
                                    ? z.ZodVoid
                                    : T extends SzLiteral<infer Value>
                                      ? z.ZodLiteral<Value>
                                      : T extends SzTuple<infer _Items>
                                        ? z.ZodTuple<any>
                                        : T extends SzSet<infer Value>
                                          ? z.ZodSet<Dezerialize<Value>>
                                          : T extends SzArray<infer Element>
                                            ? z.ZodArray<Dezerialize<Element>>
                                            : T extends SzObject<
                                                  infer Properties
                                                >
                                              ? z.ZodObject<{
                                                  [Property in keyof Properties]: Dezerialize<
                                                    Properties[Property]
                                                  >;
                                                }>
                                              : T extends SzRecord<
                                                    infer Key,
                                                    infer Value
                                                  >
                                                ? z.ZodRecord<
                                                    Dezerialize<Key>,
                                                    Dezerialize<Value>
                                                  >
                                                : T extends SzMap<
                                                      infer Key,
                                                      infer Value
                                                    >
                                                  ? z.ZodMap<
                                                      Dezerialize<Key>,
                                                      Dezerialize<Value>
                                                    >
                                                  : T extends SzEnum<
                                                        infer Values
                                                      >
                                                    ? z.ZodEnum<Values>
                                                    : T extends SzUnion<
                                                          infer _Options
                                                        >
                                                      ? z.ZodUnion<any>
                                                      : T extends SzDiscriminatedUnion<
                                                            infer Discriminator,
                                                            infer _Options
                                                          >
                                                        ? z.ZodDiscriminatedUnion<
                                                            Discriminator,
                                                            any
                                                          >
                                                        : T extends SzIntersection<
                                                              infer L,
                                                              infer R
                                                            >
                                                          ? z.ZodIntersection<
                                                              Dezerialize<L>,
                                                              Dezerialize<R>
                                                            >
                                                          : T extends SzFunction<
                                                                infer Args,
                                                                infer Return
                                                              >
                                                            ? z.ZodFunction<
                                                                Dezerialize<Args>,
                                                                Dezerialize<Return>
                                                              >
                                                            : T extends SzPromise<
                                                                  infer Value
                                                                >
                                                              ? z.ZodPromise<
                                                                  Dezerialize<Value>
                                                                >
                                                              : T extends SzEffect<
                                                                    infer Value
                                                                  >
                                                                ? z.ZodEffects<
                                                                    Dezerialize<Value>
                                                                  >
                                                                : T extends SzCatch<
                                                                      infer Value
                                                                    >
                                                                  ? z.ZodCatch<
                                                                      Dezerialize<Value>
                                                                    >
                                                                  : T extends SzNativeEnum<
                                                                        infer Value
                                                                      >
                                                                    ? z.ZodNativeEnum<Value>
                                                                    : unknown;
export declare function dezerializeRefs(
  shape: SzType,
  opts: DezerializerOptions,
): ZodTypes;
export declare function dezerialize(
  shape: SzType,
  opts?: Partial<DezerializerOptions>,
): ZodTypes;
export {};
