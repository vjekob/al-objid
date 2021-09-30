# Summary

Upgrade to v2 of back-end API is underway.

## Goals

These are the goals of this new API:
1. Reduce the overall number of calls to the back end. Right now the number of calls is not big, but still
there are potentially too many calls being placed and this will inevitably lead to back end costing too much.
The overall goal is to be able to support 20.000 developers working 8 hours per day, placing a call on
average every two minutes.
2. Reduce the overall number of read and write operations in the back end. At the moment, every operation
does at minimum two read operations, and most common operation (getting a new number) does total of six
read operations and six write operations. Namely, for getting a new number this can be reduced to maximum
two reads and one write per call.
3. Make every API call *batch-callable*. In v1 most of the calls allowed one operation of the same type per
call (for example: to authorize ten apps in a workspace, there have to be ten separate authorization calls).
Batch calling would allow any call to perform the same type of operation for multiple different apps at the
same time.

## Non-goals

The API upgrade does *NOT* have the following goals:
1. API v2 ***WILL NOT*** be backwards compatible with API v1. This means that both input and output, but also
even operation endpoints and methods may change.

## Do not break v1!

There is full testability in place for v1. Achieving the goals above means that v1 API will have to change
the internal workings (namely, to support the data format of v2). None of the tests for v1 may fail. The
existing v1 API must be resilient to any changes introduced to support v2.

## Specific ideas

Blob updates should not happen as a part of a function body. Instead, each function body should return, in
addition to its regular response, a specification of blobs to be updated. It should be an array of blob
name and content, plus, perhaps a method - (over)write or update. Then, once all function bodies are processes
(e.g. in a multi-body request), all blobs are written at once. Also, all blob writes that can be consolidated
are consolidated.
