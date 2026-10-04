# Post-mortem API and frontend integration

The backend exposes reports at `${VITE_API_URL}/post-mortems`, using the same
Express routes, controllers, services, and Mongoose models as incidents. The
local Swagger UI at `/api-docs/` includes all endpoints, schemas, filters, and
error responses. These routes become available in the deployed API after this
branch is deployed.

At the time of implementation, `frontend/src/components/App.jsx` has no
post-mortem routes, and the sidebar section is commented out. No post-mortem
API client or form exists. The following contract supports later frontend work.

## Endpoints

| Method | Path                   | Authentication   | Successful response                                     |
| ------ | ---------------------- | ---------------- | ------------------------------------------------------- |
| POST   | `/post-mortems`        | JWT bearer token | `201`, created report                                   |
| GET    | `/post-mortems`        | Public           | `200`, paginated collection                             |
| GET    | `/post-mortems/search` | Public           | `200`, same collection and filters as the list endpoint |
| GET    | `/post-mortems/:id`    | Public           | `200`, report                                           |
| PATCH  | `/post-mortems/:id`    | JWT bearer token | `200`, updated report                                   |
| DELETE | `/post-mortems/:id`    | JWT bearer token | `200`, deleted report                                   |

Send JSON bodies with `Content-Type: application/json`. For writes, send
`Authorization: Bearer <token>` using the token returned by `/auth/login`, just
as the existing incident API client does. Any authenticated user can create,
edit, or delete a report; no role or creator-only restrictions are introduced.
Reads are public, consistent with the existing incident read endpoints.

`:id` is the report's MongoDB `_id`, not `incidentId` or the human-readable
`incidentAutoId`. All IDs are 24-character hexadecimal MongoDB ObjectIds. Incident
and creator references are returned as ID strings, without populated documents;
use `/incidents/:id` and `/users/:id` to fetch their details.

## Create a report

```json
{
    "incidentId": "507f1f77bcf86cd799439011",
    "rootCause": "The database connection pool was exhausted.",
    "impact": "The production API was unavailable for 30 minutes.",
    "actionItems": [
        { "description": "Add connection pool monitoring." },
        { "description": "Review timeout settings.", "status": "In Progress" }
    ],
    "lessonsLearned": "Alert on saturation before requests begin to fail."
}
```

`incidentId`, `rootCause`, and `impact` are required. The incident must exist.
`rootCause` and `impact` must be non-empty strings after trimming. Text fields,
including action descriptions, are trimmed. `lessonsLearned` is optional and
defaults to `""`. `actionItems` is optional and defaults to `[]`; each item requires
a non-empty string `description`. Item `status` is one of `Pending`, `In Progress`,
or `Completed`, defaulting to `Pending` when omitted. Null values are invalid.

The backend takes `createdBy` from the JWT. Client-supplied identifiers,
attribution, timestamps, MongoDB operators, and unsupported fields are ignored.

The response is a report document, for example:

```json
{
    "_id": "507f1f77bcf86cd799439012",
    "incidentId": "507f1f77bcf86cd799439011",
    "rootCause": "The database connection pool was exhausted.",
    "impact": "The production API was unavailable for 30 minutes.",
    "actionItems": [
        {
            "_id": "507f1f77bcf86cd799439014",
            "description": "Add connection pool monitoring.",
            "status": "Pending"
        }
    ],
    "lessonsLearned": "Alert on saturation before requests begin to fail.",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2026-10-05T00:00:00.000Z",
    "updatedAt": "2026-10-05T00:00:00.000Z",
    "__v": 0
}
```

## Listing, incident lookup, and search

Both collection endpoints return the same envelope, following the users API:

```json
{
    "total": 0,
    "page": 1,
    "limit": 10,
    "postMortems": []
}
```

`total` counts all reports matching the filters, before pagination. Results are
sorted by `createdAt` descending, then `_id` descending for stable ordering.
Pages without results return an empty array with HTTP `200`.

| Query parameter    | Behavior                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `page`             | Positive integer up to `9007199254740991`; defaults to `1`                                                  |
| `limit`            | Integer from `1` to `100`; defaults to `10`                                                                 |
| `incidentId`       | Exact incident ObjectId                                                                                     |
| `createdBy`        | Exact creator ObjectId                                                                                      |
| `rootCause`        | Case-insensitive literal substring                                                                          |
| `impact`           | Case-insensitive literal substring                                                                          |
| `lessonsLearned`   | Case-insensitive literal substring                                                                          |
| `actionItemStatus` | At least one item has the selected status                                                                   |
| `search`           | Case-insensitive literal substring across root cause, impact, lessons learned, and action item descriptions |

Filters combine with AND; global search matches any of its four fields. Search
text is treated literally, including characters such as `.` or `*`, rather than
as a regular expression. Unsupported query parameters are ignored. Invalid
supported filters, repeated values, and invalid pagination return HTTP `400`.
Use Axios `params` or `URLSearchParams` to encode spaces and other characters.

For an incident details screen, request
`GET /post-mortems?incidentId=<incident._id>&limit=1`. Read
`response.data.postMortems[0]`; an empty array means there is no report. It is
also empty when the supplied incident ObjectId does not exist. A malformed ID
returns `400`. Store the returned report `_id` for subsequent fetches, edits,
and deletion.

An Axios client can follow the existing incident client:

```js
const baseUrl = `${import.meta.env.VITE_API_URL}/post-mortems`;
const headers = { Authorization: `Bearer ${jwt}` };

const { data: created } = await axios.post(baseUrl, payload, { headers });
const { data: result } = await axios.get(baseUrl, {
    params: { incidentId, page: 1, limit: 10 },
});
const { data: updated } = await axios.patch(
    `${baseUrl}/${created._id}`,
    { lessonsLearned: 'Monitor connection pool saturation.' },
    { headers }
);
await axios.delete(`${baseUrl}/${created._id}`, { headers });
```

## Editing and deletion

PATCH accepts any subset of `rootCause`, `impact`, `actionItems`, and
`lessonsLearned`. At least one editable field is required. Omitted fields remain
unchanged. The same field validation applies as on creation.

Send `actionItems: []` to clear all action items or `lessonsLearned: ""` to clear
lessons learned. An action item array replaces the entire existing array: send
all items you want to retain, including their statuses. Replacement items get
new MongoDB subdocument IDs, and omitted statuses default to `Pending`.
There are no separate action-item endpoints.

The incident link and original creator cannot be changed. To move a report,
delete it and create another for the desired incident. Deleting a report leaves
the incident intact and permits a new report to be created for that incident.
The existing `DELETE /incidents/:id` route also removes its associated report.
Incident deletion and report cleanup are separate database operations, following
the existing application's service pattern; they are not transactional. If
cleanup fails after an incident is removed, delete the remaining report by its
report ID before retrying application work. Direct database deletion and the
internal bulk incident deletion helper do not perform this route's cleanup.

## Errors

| Status | Meaning                                                                           |
| ------ | --------------------------------------------------------------------------------- |
| `400`  | Invalid body, query, or ObjectId; empty/immutable-only PATCH                      |
| `401`  | No authorization header for a write                                               |
| `403`  | Invalid, malformed, or expired token                                              |
| `404`  | Report not found, or incident missing during creation                             |
| `409`  | A report already exists for the incident, including concurrent creation conflicts |
| `500`  | Database or unexpected server failure                                             |

Body/query validation follows the existing validation middleware shape:

```json
{
    "errors": [
        {
            "type": "field",
            "value": "",
            "msg": "rootCause must be a non-empty string.",
            "path": "rootCause",
            "location": "body"
        }
    ]
}
```

Other errors return `{ "message": "Post-mortem not found." }` or another relevant
message. Display `response.data.errors` as field errors and
`response.data.message` as the overall error. On `409`, fetch the existing report
by `incidentId` and offer to view or edit it. On `401` or `403`, return to login.

## Lifecycle assumptions and deployment

There is one report per incident. Creation is allowed for an existing incident
in any status: the current model and incident routes do not enforce a resolved
incident prerequisite. The frontend can suggest completing a report after
resolution. Reports have no separate lifecycle status; statuses belong to
action items. PDF export is a future enhancement and has no endpoint here.

The model now declares a unique index on `incidentId`, which is necessary to
enforce the one-report rule during concurrent requests. For an existing database,
check for duplicate reports before rolling out the index:

```js
// Run against the intended database in mongosh.
db.postmortems.aggregate([
    {
        $group: {
            _id: '$incidentId',
            reportIds: { $push: '$_id' },
            count: { $sum: 1 },
        },
    },
    { $match: { count: { $gt: 1 } } },
]);
```

If duplicates exist, review and consolidate their content before removing
redundant reports. Preserve the IDs needed by consumers. Once duplicates are
resolved, create or verify the unique index before accepting API traffic:

```js
db.postmortems.createIndex({ incidentId: 1 }, { unique: true });
db.postmortems.getIndexes();
```

Mongoose's automatic index creation can create this index for a fresh database.
Do not rely only on the API's duplicate pre-check: the database index is what
protects concurrent creates. No schema fields need renaming and the existing
post-mortem seed data remains compatible.

Run `npm test -- --runInBand` under Node 24 to check existing tests and the new
post-mortem route/model tests. Route tests exercise the mounted Express app,
actual JWT verification, validation, controllers, and services using native
HTTP streams in memory and mocked database operations. They open no network
ports and do not connect to MongoDB. Database index enforcement should also be
verified during deployment using the commands above.
