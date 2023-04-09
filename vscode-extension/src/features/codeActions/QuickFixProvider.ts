import { QuickFixContext } from "./QuickFixContext";

export interface QuickFixProvider {
    (context: QuickFixContext): void | Promise<void>;
}
