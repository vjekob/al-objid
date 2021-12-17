import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";

const syncIds = new ALNinjaRequestHandler<{}, boolean>(async (request) => !!request.bindings.app);

export default syncIds.azureFunction;
