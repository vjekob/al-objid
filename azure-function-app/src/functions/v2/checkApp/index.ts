import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";

// Returns string.toLowerCase() because returning boolean results in True/False rather than true/false
const checkApp = new ALNinjaRequestHandler<{}, string>(async (request) => `${!!request.bindings.app}`.toLowerCase());

checkApp.skipAuthorization();

export default checkApp.azureFunction;
