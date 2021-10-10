import { AppInfo } from "./AppInfo";

interface CheckRequestEntry {
    appId: string;
    authKey?: string;
}

export type CheckRequest = CheckRequestEntry | CheckRequestEntry[];

export type CheckResponse = {
    [key: string]: AppInfo;
} & {
    _news: NewsEntry[];
}

export enum NewsType {
    announcement = "announcement",
    openmd = "openmd",
}

export enum NewsActionType {
    dismiss = "dismiss",
    snooze = "snooze",
    url = "url",
}

export interface NewsButton {
    caption: string;
    action: NewsActionType;
    parameter?: any;
}

export interface NewsEntry {
    id: string;
    type: NewsType;
    message: string;
    buttons: NewsButton[];
}
