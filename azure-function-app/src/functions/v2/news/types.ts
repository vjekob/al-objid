export enum AnnouncementType {
    announcement = "announcement"
}

export enum NewsActionType {
    dismiss = "dismiss",
    snooze = "snooze",
    url = "url"
}

export interface NewsButton {
    caption: string;
    action: NewsActionType;
    parameter?: any;
}

export interface NewsEntry {
    id: string;
    type: AnnouncementType;
    message: string;
    buttons: NewsButton[];
}

export interface NewsResponse {
    news: NewsEntry[];
}

export interface NewsBindings {
    news: NewsEntry[];
}
