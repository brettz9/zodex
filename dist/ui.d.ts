import React from "react";
import { SzInfer } from "./infer.js";
import { SzType } from "./types.js";
type ShapeValueProps<Value> = {
  value: Value;
  onChange: (_value: Value) => void;
};
type ShapeProps<T extends SzType> = {
  shape: T;
} & ShapeValueProps<SzInfer<T>>;
type MappedShapeControl<T extends SzType> = {
  [Type in T["type"]]: React.FC<
    ShapeProps<
      Extract<
        T,
        {
          type: Type;
        }
      >
    >
  >;
};
export declare function mapTypesToViews<T extends SzType>(
  controls: MappedShapeControl<T>,
): <I = SzInfer<T>>({
  shape,
  value,
  onChange,
}: {
  shape: T;
  value: I;
  onChange: (_value: I) => void;
}) => React.FunctionComponentElement<
  ShapeProps<
    Extract<
      T,
      {
        type: T["type"];
      }
    >
  >
>;
export {};
