import { Uri } from "vscode";
import { ALApp } from "../ALApp";

export interface GitTopLevelPathContext {
    uri: Uri;
    apps: ALApp[];
    branch: string;
}
