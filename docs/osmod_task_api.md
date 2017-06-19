#OSMODTaskAPI

The OSMOD Task API exposes the worker tasks on HTTP endpoints to support
`push`-style message consumption.

This documentation covers the following tasks:

```text
processMachineScore
heartbeat
processTagAddition
processTagRevocation
sendCommentForScoring
deferComments
highlightComments
tagComments
tagCommentSummaryScores
acceptComments
rejectComments
resetTag
resetComments
confirmTag
confirmCommentSummaryScore
rejectCommentSummaryScore
rejectTag
addTag
removeTag
```


## Payload Formats

All payloads should be wrapped in a `data` object of the form...
```json
{
    "data": {...}
}
```

```json
{
    "data": [...]
}
```

Refer to [backend-queue/tasks](https://github.com/Jigsaw-Code/moderator/tree/dev/packages/backend-queue/src/tasks) for the task schemas.

Field names correspond to key-value in the JSON objects and the types are the expected payload type formats.

For example, take a `processMachineScore` task with the following data interface.
```typescript
export interface IProcessMachineScoreData {
  commentId: number;
  userId: number;
  scoreData: IScoreData;
  runImmediately?: boolean;
}
```

Its payload would look like the following JSON body.
```json
{
    "data": {
        "commentId": "1",
        "userId": "1",
        "scoreData": {
            "scores": [{"score": 0.8, "begin": 1, "end": 53}],
            "summaryScores": {
                "OBSCENE": 0.9,
                "INFLAMMATORY": 0.7
            }
        },
        "runImmediately": true
    }
}
```
