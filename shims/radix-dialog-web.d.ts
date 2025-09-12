import * as React from "react";

export interface RootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const Root: React.FC<RootProps>;
export const Trigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
export const Portal: React.FC<{ children?: React.ReactNode }>;
export const Overlay: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const Content: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const Title: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const Description: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const Close: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;

declare const _default: {
  Root: typeof Root;
  Trigger: typeof Trigger;
  Portal: typeof Portal;
  Overlay: typeof Overlay;
  Content: typeof Content;
  Title: typeof Title;
  Description: typeof Description;
  Close: typeof Close;
};
export default _default;