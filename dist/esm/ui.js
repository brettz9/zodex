import React from "react";
export function mapTypesToViews(controls) {
  return function ShapeControl({ shape, value, onChange }) {
    return React.createElement(controls[shape.type], {
      shape,
      value,
      onChange,
    });
  };
}
