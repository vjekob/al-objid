import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";

// Have to return string.toLowerCase() because returning boolean results in True/False rather than true/false
const syncIds = new ALNinjaRequestHandler<{}, string>(async (request) => `${!!request.bindings.app}`.toLowerCase());

export default syncIds.azureFunction;
