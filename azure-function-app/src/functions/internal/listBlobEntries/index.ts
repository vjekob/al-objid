import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { Blob } from "../../../common/Blob";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let blob = new Blob<any>("");
    let token = null;
    let data = [];
    while (true) {
        let results = await blob.readAll(token);
        token = results.token;
        data.push(...results.entries);
        if (!token) break;
    }
    let body = null;
    if (req.query.perApp === "1") {
        body = {};
        for (let entry of data) {
            let parts = entry.name.split("/");
            if (!body[parts[0]]) body[parts[0]] = 0;
            body[parts[0]]++;
        }
    } else {
        let sortBy = req.query.sortBy || "lastModified";
        body = data.sort((left, right) => {
            let sortLeft = sortBy === "contentLength" ? parseInt(left[sortBy]) : new Date(left[sortBy]);
            let sortRight = sortBy === "contentLength" ? parseInt(right[sortBy]) : new Date(right[sortBy]);
            return sortLeft > sortRight ? -1 : sortLeft === sortRight ? 0 : 1;
        });
    }
    context.res = { body };
};

export default httpTrigger;
