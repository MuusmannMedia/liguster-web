// Minimal shim so SSR / web bundling won't choke on Radix dialog imports.
import * as React from "react";

type P = React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (o: boolean) => void };

export const Root = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const Trigger = ({ children, ...rest }: P) => <button {...rest}>{children}</button>;
export const Portal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const Overlay = (props: P) => <div {...props} />;
export const Content = (props: P) => <div {...props} />;
export const Title = (props: P) => <div {...props} />;
export const Description = (props: P) => <div {...props} />;

// default export compatibility (some libs import default)
export default { Root, Trigger, Portal, Overlay, Content, Title, Description };