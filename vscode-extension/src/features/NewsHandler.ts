import path = require("path");
import { commands, Disposable, env, ExtensionContext, Uri, window } from "vscode";
import { NewsEntry } from "../lib/types/NewsEntry";
import { NewsButton } from "../lib/types/NewsButton";
import { NewsActionType } from "../lib/types/NewsActionType";
import { NewsType } from "../lib/types/NewsType";
import { CodeCommand } from "../commands/commands";
import openExternal from "../lib/functions/openExternal";

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

export class NewsHandler implements Disposable {
    private static _instance: NewsHandler;

    public static get instance() {
        if (!this._instance) {
            throw new Error("You must not access NewsHandler.instance before it has been instantiated.");
        }
        return this._instance;
    }

    private _timeout: NodeJS.Timeout | undefined;
    private _snoozeTimeout: NodeJS.Timeout | undefined;
    private _disposed: boolean = false;
    private _context: ExtensionContext;
    private _firstRun: boolean = true;

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
        openExternal(button.parameter);
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
        [NewsActionType.snooze]: (entry: NewsEntry, button: NewsButton) =>
            this.snooze(entry, button.parameter * 1000 * 60),
    };

    private processNewsEntry(entry: NewsEntry): boolean {
        let processFunc = this.process[entry.type];
        const keys = this._context.globalState.keys();
        if (typeof processFunc !== "function" || this._context.globalState.get(statusKey(entry.id)) !== undefined) {
            return false;
        }
        if (!this._firstRun && ONLY_ON_FIRST_RUN.includes(entry.type)) {
            return false;
        }
        this.markAsShown(entry);
        processFunc(entry);
        return true;
    }

    private process: NewsProcessor<void> = {
        [NewsType.announcement]: async (entry: NewsEntry) => {
            let response = await window.showInformationMessage(
                entry.message,
                ...entry.buttons.map(button => button.caption)
            );
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
            commands.executeCommand(CodeCommand.MarkdownShowPreview, uri);
        },
    };

    private checkSnoozedEntries() {
        const keys = this._context.globalState.keys().filter(key => key.startsWith(ENTRY_SNOOZED));
        for (let key of keys) {
            let snoozed = this._context.globalState.get(key) as SnoozedNewsEntry;
            if (snoozed.showAt < Date.now()) {
                this.handleSnoozed(snoozed);
            }
        }
    }

    private async initialize() {
        this._snoozeTimeout = setInterval(() => this.checkSnoozedEntries(), 1000);
    }

    constructor(context: ExtensionContext) {
        if (NewsHandler._instance) {
            throw new Error(
                "Only a single instance of HttpGone class is allowed! Check the call stack and fix the problem."
            );
        }
        NewsHandler._instance = this;

        this._context = context;
        this.initialize();
    }

    public updateNews(news: NewsEntry[]): boolean {
        this.cleanUpCache(news.map(entry => entry.id));
        let shown = false;
        for (let entry of news) {
            shown = shown || this.processNewsEntry(entry);
        }
        this._firstRun = false;
        return shown;
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
