import path = require("path");
import { commands, env, ExtensionContext, Uri, window } from "vscode";
import { Backend } from "../lib/Backend";
import { NewsActionType, NewsButton, NewsEntry, NewsType } from "../lib/BackendTypes";

const POLLING_INTERVAL = 3600 * 1000; // One hour

enum NewsEntryStatus {
    shown = 0,
    dismissed = 1,
    snoozed = 2,
}

interface NewsProcessor<T> {
    [key: string]: (entry: NewsEntry, additional: T) => void;
}

interface SnoozedNewsEntry extends NewsEntry {
    showAt: number;
}

const ONLY_ON_FIRST_RUN = [NewsType.openmd];
const NEWS_KEY = "news/";
const ENTRY_STATUS = `${NEWS_KEY}entry-status`;
const ENTRY_SNOOZED = `${NEWS_KEY}entry-snoozed`;

function statusKey(id: string) {
    return `${ENTRY_STATUS}/${id}`;
}

function snoozeKey(id: string) {
    return `${ENTRY_SNOOZED}/${id}`;
}

export class NewsHandler {
    private _timeout: NodeJS.Timeout | undefined;
    private _snoozeTimeout: NodeJS.Timeout | undefined;
    private _disposed: boolean = false;
    private _context: ExtensionContext;

    private markAsShown(entry: NewsEntry) {
        this._context.globalState.update(statusKey(entry.id), NewsEntryStatus.shown);
    }

    private snooze(entry: NewsEntry, snoozeBy: number = 15 * 60 * 1000) {
        const snoozedEntry: SnoozedNewsEntry = { ...entry, showAt: Date.now() + snoozeBy };
        this._context.globalState.update(snoozeKey(entry.id), snoozedEntry);
        this._context.globalState.update(statusKey(entry.id), NewsEntryStatus.snoozed);
    }

    private handleSnoozed(entry: NewsEntry) {
        this._context.globalState.update(snoozeKey(entry.id), undefined);
        this._context.globalState.update(statusKey(entry.id), undefined);
        this.process[entry.type](entry);
    }

    private dismiss(entry: NewsEntry) {
        this._context.globalState.update(statusKey(entry.id), NewsEntryStatus.dismissed);
    }

    private navigateToUrl(entry: NewsEntry, button: NewsButton) {
        this.dismiss(entry);
        env.openExternal(Uri.parse(button.parameter));
    }

    private cleanUpCache(ids: string[]) {
        const keys = this._context.globalState.keys().filter(key => key.startsWith(`${NEWS_KEY}`));
        for (let key of keys) {
            const parts = key.split("/");
            const id = parts[parts.length - 1];
            if (!ids.includes(id)) {
                this._context.globalState.update(key, undefined);
            }
        }
    }

    private takeAction: NewsProcessor<NewsButton> = {
        [NewsActionType.dismiss]: (entry: NewsEntry) => this.dismiss(entry),
        [NewsActionType.url]: (entry: NewsEntry, button: NewsButton) => this.navigateToUrl(entry, button),
        [NewsActionType.snooze]: (entry: NewsEntry, button: NewsButton) => this.snooze(entry, button.parameter * 1000 * 60),
    }

    private processNewsEntry(firstRun: boolean, entry: NewsEntry) {
        let processFunc = this.process[entry.type];
        const keys = this._context.globalState.keys();
        if (typeof processFunc !== "function" || this._context.globalState.get(statusKey(entry.id)) !== undefined) {
            return;
        }
        if (!firstRun && ONLY_ON_FIRST_RUN.includes(entry.type)) {
            return;
        }
        this.markAsShown(entry);
        processFunc(entry);
    }

    private process: NewsProcessor<void> = {
        [NewsType.announcement]: async (entry: NewsEntry) => {
            let response = await window.showInformationMessage(entry.message, ...entry.buttons.map(button => button.caption));
            if (response === undefined) {
                this.snooze(entry);
                return;
            }

            for (let button of entry.buttons) {
                if (response === button.caption) {
                    const buttonAction = this.takeAction[button.action];
                    if (typeof buttonAction !== "function") {
                        continue;
                    }
                    buttonAction(entry, button);
                    break;
                }
            }
        },

        [NewsType.openmd]: async (entry: NewsEntry) => {
            let uri = Uri.file(path.join(__dirname, `../../docs/${entry.message}`));
            commands.executeCommand("markdown.showPreview", uri);
        },
    }

    private checkSnoozedEntries() {
        const keys = this._context.globalState.keys().filter(key => key.startsWith(ENTRY_SNOOZED));
        for (let key of keys) {
            let snoozed = this._context.globalState.get(key) as SnoozedNewsEntry;
            if (snoozed.showAt < Date.now()) {
                this.handleSnoozed(snoozed);
            }
        }
    }

    constructor(context: ExtensionContext) {
        this._context = context;
        this.initialize();
    }

    private async initialize() {
        await this.checkNews(true);

        // Set up polling interval
        this._timeout = setInterval(() => this.checkNews(), POLLING_INTERVAL);
        this._snoozeTimeout = setInterval(() => this.checkSnoozedEntries(), 1000);
    }

    private async checkNews(firstRun: boolean = false) {
        if (this._disposed) return;

        let news = await Backend.getNews();
        this.cleanUpCache(news.map(entry => entry.id));
        for (let entry of news) {
            this.processNewsEntry(firstRun, entry);
        }
    }

    public dispose() {
        if (!this._disposed) return;
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        if (this._snoozeTimeout) {
            clearTimeout(this._snoozeTimeout);
        }
        this._disposed = true;
        this._timeout = undefined;
        this._snoozeTimeout = undefined;
    }
}
