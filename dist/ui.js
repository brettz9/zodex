"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTypesToViews = mapTypesToViews;
const react_1 = __importDefault(require("react"));
function mapTypesToViews(controls) {
  return function ShapeControl({ shape, value, onChange }) {
    return react_1.default.createElement(controls[shape.type], {
      shape,
      value,
      onChange,
    });
  };
}
