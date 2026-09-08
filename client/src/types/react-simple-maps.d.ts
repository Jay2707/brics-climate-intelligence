declare module "react-simple-maps" {
  import type { ComponentType, ReactNode } from "react";

  export const ComposableMap: ComponentType<Record<string, unknown>>;
  export const Geographies: ComponentType<Record<string, unknown>>;
  export const Geography: ComponentType<Record<string, unknown>>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const Marker: ComponentType<Record<string, unknown>>;
  export const ZoomableGroup: ComponentType<Record<string, unknown>>;

  export type MapChildren = ReactNode;
}
