import { EventLogEntry } from "./EventLogEntry";
import { ALRange } from "./ALRange";
import { ConsumptionData } from "./ConsumptionData";

export type AppCacheInfo = {
    _ranges: ALRange[];
    _log: EventLogEntry[];
} & ConsumptionData;
