import { OBJECT_TYPES } from "./constants";

export interface ALObject {
    type: string;
    id: number;
    name: string;
}

const STATE = {
    ROOT: Symbol("ROOT"),
    STRING: Symbol("STRING"),
    STRING_ESCAPE: Symbol("STRING_ESCAPE"),
    COMMENT: Symbol("COMMENT"),
    COMMENT_BLOCK: Symbol("COMMENT_BLOCK"),
    PRAGMA: Symbol("PRAGMA"),
}

const DECLARATION_STATE = {
    TYPE: Symbol("TYPE"),
    ID: Symbol("ID"),
    NAME: Symbol("NAME"),
    NAME_QUOTED: Symbol("NAME_QUOTED"),
    NAME_ESCAPE: Symbol("NAME_SCAPE"),
    REMAINDER: Symbol("REMAINDER")
}

function parseObjectDeclaration(line: string): ALObject | null {
    let state = DECLARATION_STATE.TYPE;
    let type = "";
    let id = 0;
    let objid = "";
    let name = "";
    let expectsId = false;

    for (let i = 0; i < line.length; i++) {
        let c = line[i];
        switch (c) {
            case " ":
                switch (state) {
                    case DECLARATION_STATE.TYPE:
                        type = type.trim().toLowerCase();
                        if (type === "dotnet") {
                            return null;
                        }
                        expectsId = OBJECT_TYPES.includes(type);
                        state = expectsId ? DECLARATION_STATE.ID : DECLARATION_STATE.NAME;
                        break;
                    case DECLARATION_STATE.ID:
                        if (objid === "") break;
                        id = parseInt(objid.trim());
                        if (!id) {
                            return null;
                        }
                        state = DECLARATION_STATE.NAME;
                        break;
                    case DECLARATION_STATE.NAME:
                        if (name === "") break;
                        name = name.trim();
                        state = DECLARATION_STATE.REMAINDER;
                        break;
                    case DECLARATION_STATE.NAME_QUOTED:
                        name += c;
                        break;
                }
                break;
            case '"':
                switch (state) {
                    case DECLARATION_STATE.NAME:
                        state = DECLARATION_STATE.NAME_QUOTED;
                        break;
                    case DECLARATION_STATE.NAME_QUOTED:
                        if (i < line.length - 1 && line[i + 1] === '"') {
                            state = DECLARATION_STATE.NAME_ESCAPE;
                            name += c;
                            break;
                        }
                        state = DECLARATION_STATE.NAME;
                        break;
                    case DECLARATION_STATE.NAME_ESCAPE:
                        state = DECLARATION_STATE.NAME_QUOTED;
                        break;
                }
                break;
            default:
                switch (state) {
                    case DECLARATION_STATE.TYPE:
                        type += c;
                        break;
                    case DECLARATION_STATE.ID:
                        objid += c;
                        break;
                    case DECLARATION_STATE.NAME:
                    case DECLARATION_STATE.NAME_QUOTED:
                        name += c;
                        break;
                    case DECLARATION_STATE.NAME_ESCAPE:
                        debugger;
                        break;
                }
                break;
        }
    }

    name = name.trim();

    if (!id && !name) return null;
    if (expectsId && !id) return null;

    return {
        type,
        id,
        name
    };
}

export function parseObjects(text: string, returnOnFirstObject: boolean): ALObject[] {
    let line = "";
    let block = 0;

    let previous = "";
    let state = STATE.ROOT;

    let objects: ALObject[] = [];

    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        switch (c) {
            case "\r":
            case "\n":
                switch (state) {
                    case STATE.PRAGMA:
                    case STATE.COMMENT:
                        state = STATE.ROOT;
                        break;
                    case STATE.ROOT:
                        if (previous !== "\r" && previous !== "\n") line += " ";
                        break;
                }
                if (state === STATE.COMMENT) state = STATE.ROOT;
                break;
            case "*":
                if (state === STATE.ROOT && previous === "/") state = STATE.COMMENT_BLOCK;
                break;
            case "'":
                switch (state) {
                    case STATE.ROOT:
                        state = STATE.STRING;
                        break;
                    case STATE.STRING:
                        if (i < text.length - 1 && text[i + 1] === "'") {
                            state = STATE.STRING_ESCAPE;
                            break;
                        }
                        state = STATE.ROOT;
                        break;
                    case STATE.STRING_ESCAPE:
                        state = STATE.STRING;
                        break;
                }
                break;
            case "#":
                if (state === STATE.ROOT && previous === "" || previous === "\r" || previous === "\n") state = STATE.PRAGMA;
                break;
            case "/":
                switch (state) {
                    case STATE.ROOT:
                        if (previous === "/") state = STATE.COMMENT;
                        break;
                    case STATE.COMMENT_BLOCK:
                        if (previous === "*") state = STATE.ROOT;
                        break;
                }
                break;
            case "{":
                if (state === STATE.ROOT) {
                    if (!block) {
                        let object = parseObjectDeclaration(line.trim());
                        if (object) {
                            objects.push(object);
                            if (returnOnFirstObject) return objects;
                        }
                        line = "";
                    }
                    block++;
                }
                break;
            case "}":
                if (state === STATE.ROOT) {
                    block--;
                    if (!block) line += "\n";
                }
                break;
            default:
                if (state === STATE.ROOT && !block) line += c;
                break;
        }
        previous = c;
    }
    return objects;
}
