import { NewsButton } from "./NewsButton";
import { NewsType } from "./NewsType";

export interface NewsEntry {
    id: string;
    type: NewsType;
    message: string;
    buttons: NewsButton[];
}
