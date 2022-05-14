/**
 * This command is internal.
 *
 * Executes the commit callback passed into it. The object ID completion provider calls this command after the user
 * completes the suggestion. This command simply calls back into the closure of the scope from where the suggestion
 * wasa done, and then completes the object ID suggestion by retrieving the committed object ID from the back end.
 *
 * @param commit Callback to invoke when this command executes
 */
export const commitSuggestion = (commit: Function) => {
    if (typeof commit === "function") {
        commit();
    }
};
