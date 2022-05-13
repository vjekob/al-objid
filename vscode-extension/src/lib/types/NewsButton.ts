import { NewsActionType } from "./NewsActionType";

export interface NewsButton {
    caption: string;
    action: NewsActionType;
    parameter?: any;
}
