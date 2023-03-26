/*

A note to contributors:

The list below includes all the publishers that have requested that their apps not send personal user information to the back end.
If you want to add your publisher to this list, please open a pull request with the following changes:
- Add your publisher name to the list below (in the protectedPublishers array)
- Describe your request in the pull request description

Please keep in mind the following:
- The only effect of this change is that developers who work with apps with your publisher specified in the app.json file will
  not see notifications about other developers consuming object IDs.
- Information shared with the back end includes username and email address in encrypted form. The encryption key is derived from
  the app ID, which is a GUID. The GUID is not sent to the back end, and the encryption key is derived from the GUID in a way that
  makes it impossible to reverse the process and get the GUID back. Nobody else, not even the Ninja team, can decrypt the information
  being shared.
- The information is only retained by the back end for a short period of time, and is not used for any other purpose than to facilitate
  the object ID consumption notifications.

*/

const protectedPublishers: string[] = ["Microsoft"];

/**
 * Checks if the specified publisher is protected. Protected publishers are those that do not want their apps to send
 * personal user information to the back end.
 *
 * @param publisher Name of the publisher to check
 * @returns Boolean value indicating whether the specified publisher is protected
 */
export function isProtectedPublisher(publisher: string): boolean {
    return protectedPublishers.includes(publisher);
}
