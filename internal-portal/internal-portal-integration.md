# Internal Portal — API integration guide

For the **internal portal**: the web app bank staff log into — **BankAdmin**, **BankCSE**,
**BankEngineer**, and the finance officers who acknowledge RTGS settlements. Written against the
controllers as they stand on `main`, 23 September 2026.

If something here disagrees with the backend, the backend is right and this file is a bug. Say so.

---

## 1. Who you are building for

| role | holds | does |
|---|---|---|
| **BankAdmin** | `MANAGE_EMPLOYEES`, `MANAGE_ROLES`, `MANAGE_PERMISSIONS`, `MANAGE_ORGANIZATIONS`, `MANAGE_SIGNATORY_ANY`, `VIEW_ORGANIZATIONS` | everything: staff, roles, onboarding, any company's matrix |
| **BankCSE** | `MANAGE_ORGANIZATIONS`, `VIEW_ORGANIZATIONS` | onboards and services companies; **cannot** configure a matrix or manage staff |
| **BankEngineer** | `VIEW_ORGANIZATIONS` | read-only on companies; owns the collateral/engineer task queue |
| **Finance officer** | `ACKNOWLEDGE_RTGS` | acknowledges RTGS settlement |

Unlike the customer portal, **authorization here really is permission-based** — these are Spring
authorities in the JWT and `@PreAuthorize` enforces them. Read `permissions` from `/auth/me` and
drive the nav from it.

**Bank staff never approve a customer's request.** Approval is the customer's own signatories,
through the Signatory Matrix. Staff configure and observe; they do not sign.

---

## 2. Base, auth, conventions

- **Base URL:** `http://10.12.53.67:8080` (prod), `:8081` (dev). Everything under `/api/v1`.
- **Auth:** `Authorization: Bearer <accessToken>`.
- `POST /auth/login` · `POST /auth/refresh` · `GET /auth/me` · `POST /auth/change-password`.
  Access tokens last ~30 minutes.

**Errors** — one shape everywhere. **Branch on `code`, never on `message`.**

```json
{ "timestamp": "…", "status": 409, "error": "Conflict", "code": "ORG_TIN_EXISTS",
  "message": "…", "path": "/api/v1/…", "fieldErrors": [] }
```

Validation failures add `fieldErrors: [{field, message}]`. `404` means "not found **or** not yours".

**Pagination** — `{content, page, size, totalElements, totalPages, last}`, `page` zero-based, via
`?page=&size=`.

**Money** is decimal; **dates** `YYYY-MM-DD`; **timestamps** ISO-8601 UTC.

---

## 3. Employees, roles, permissions — BankAdmin

```
GET  /api/v1/employees?page=&size=            MANAGE_EMPLOYEES
POST /api/v1/employees                        MANAGE_EMPLOYEES
GET  /api/v1/employees/verify-cse             check a CSE exists before assigning
GET  /api/v1/employees/verify-engineer

GET  /api/v1/roles · GET /api/v1/roles/{id}                       MANAGE_ROLES
POST /api/v1/roles · PUT /api/v1/roles/{id}                       MANAGE_ROLES
POST /api/v1/roles/{id}/activate|deactivate                       MANAGE_ROLES
PUT  /api/v1/users/{userId}/roles                                 MANAGE_ROLES
GET  /api/v1/permissions                                          MANAGE_ROLES or MANAGE_PERMISSIONS
```

A CSE's identity is verified against **CoopStream and eTrade** when created, and again when assigned
to a company. `verify-cse` / `verify-engineer` let the form check before submitting — use them, since
a failure at assignment time is a worse place to discover a typo.

---

## 4. Organizations — the core of this portal

### Onboarding is Core Banking driven

```
GET  /api/v1/organizations/account-lookup?accountNumber=…     MANAGE_ORGANIZATIONS
POST /api/v1/organizations                                    MANAGE_ORGANIZATIONS  (multipart)
```

Two steps, in this order:

1. **`account-lookup`** with one account number the customer gave you. It resolves to their Core
   Banking `customerId` and returns that customer's accounts:
   `{found, accountNumber, customerId, customerName, accounts: [{accountNo, currency, accountType,
   status}]}`. `found: false` → Core Banking does not know the number; stop the user there.
2. **`POST /organizations`** as `multipart/form-data` with two parts:
   - `data` — JSON, `Content-Type: application/json`
   - `businessLicense` — optional file (pdf/png/jpg)

`data` fields:

| field | req | notes |
|---|:--:|---|
| `name` | ✅ | unique, case-insensitive → `409 ORG_NAME_EXISTS` |
| `accountNumber` | ✅ | the seed from step 1; becomes the primary account |
| `accountNumbers` | | the **ticked subset**. Omit or send empty to register every account the customer holds |
| `formOfBusiness` | ✅ | `COOPERATIVES` · `INDIVIDUAL_SOLE` · `PARTNERSHIPS_PLC` · `COOPERATIONS_SHARE_COMPANIES`. Missing → `400 FORM_OF_BUSINESS_REQUIRED` |
| `tin` | | 10 digits; validated non-blocking. Unique → `409 ORG_TIN_EXISTS` |
| `phone`, `address`, `description` | | `phone` unique → `409 ORG_PHONE_EXISTS` |
| `assignedCseUserId` | | assign a CSE by **identity**; must be an active BankCSE (`400 NOT_A_CSE`) |
| `cseEmail` | | the partner path's equivalent (assign by e-mail, verified first) |
| `customerId` | | anti-tamper only — derived from `accountNumber`; if sent it must match |
| `effectiveDate`, `expiryDate` | | `YYYY-MM-DD` |
| `alwaysUseSellingPriceForFCYConvertion` / `…BuyingPrice…` | | FX pricing. Both false = mid rate; both true is rejected |

**`crmSystemId` is not an input.** CSE assignment is by identity; the organization then *stores* the
assigned CSE's CRM id for the downstream loan trigger. It is returned, never accepted.

**Registration attempts verification but never blocks.** The TIN is looked up in eTrade: found and
the name matches ≥70% → `VALIDATED`; found but mismatched → `NOT_VALIDATED`; not confirmable →
`PENDING`. The organization is created either way. Show the resulting `tinValidationStatus` and the
`warnings[]` array rather than treating a non-VALIDATED result as a failure.

### Lifecycle, verification, CSE

```
GET    /api/v1/organizations?status=&q=&page=&size=       VIEW or MANAGE_ORGANIZATIONS
GET    /api/v1/organizations/{id}                         VIEW or MANAGE_ORGANIZATIONS
PUT    /api/v1/organizations/{id}                         MANAGE_ORGANIZATIONS
POST   /api/v1/organizations/{id}/suspend|activate|terminate
DELETE /api/v1/organizations/{id}                         soft delete
POST   /api/v1/organizations/{id}/assign-cse
POST   /api/v1/organizations/{id}/verify-tin              re-run the eTrade check
POST   /api/v1/organizations/{id}/verify-manual           team override
POST   /api/v1/organizations/{id}/revalidate
```

`q` matches name / tin / crmSystemId. `status` is `ACTIVE|SUSPENDED|TERMINATED`.

**`verify-manual` is the escape hatch** for TINs eTrade cannot confirm. It stamps the organization
*and every current business licence* as VALIDATED with "Manually verified by team". Capture a note —
it lands in the audit reason and is the only record of why the override happened.

A **TERMINATED** organization cannot be changed at all (`409 TERMINATED`). Make that terminal in the
UI too.

### Accounts

Same selection model as the customer portal, with the org id in the path.

```
GET    /api/v1/organizations/{id}/accounts/linkable[?accountNumber=]
POST   /api/v1/organizations/{id}/accounts                      {"accountNumbers": ["…"]}
GET    /api/v1/organizations/{id}/accounts[?includeUnselected=]
POST   /api/v1/organizations/{id}/accounts/{accountId}/set-primary
POST   /api/v1/organizations/{id}/accounts/{accountId}/deselect
DELETE /api/v1/organizations/{id}/accounts/{accountId}          204
POST   /api/v1/organizations/{id}/accounts/refresh
```

There is **no `PUT`** on an account — its attributes are Core Banking's.

A submit stores **every** account the customer holds; unticked ones get `selected: false`. An
unselected account is absent from `GET /accounts`, from the organization detail and its account
count, is never promoted to primary, cannot be named by a transfer or loan, and — importantly here —
**does not block another organization from registering it**.

That last point matters on this portal specifically: **several organizations can sit on one Core
Banking customer** (the UAT database has three). `409 ACCOUNT_LINKED_TO_ANOTHER_ORG` fires on
*selected* rows only, so onboarding one company does not lock its siblings out of accounts nobody
registered.

`currency` and the descriptive fields can be `null` — the gateway's two products disagree, and the
list-by-customer call returns accounts the per-account call cannot resolve. Still valid, still
selectable. `listingComplete: false` means "we could not list them all", not "there is one".

Errors: `400 CBS_ACCOUNT_NOT_FOUND`, `400 CBS_CUSTOMER_MISMATCH` (audited as a denied attempt),
`409 ACCOUNT_LINKED_TO_ANOTHER_ORG`, `409 NO_CBS_CUSTOMER`, `409 PRIMARY_ACCOUNT` (deselecting the
primary), `400 TOO_MANY_ACCOUNTS` (>20).

### Documents

```
GET    /api/v1/organizations/{id}/documents[?includeHistory=]
POST   /api/v1/organizations/{id}/documents?type=&documentName=      multipart, part "file"
POST   /api/v1/organizations/{id}/business-license[?documentName=]   multipart, part "file"
GET    /api/v1/organizations/{id}/documents/{documentId}             the bytes
DELETE /api/v1/organizations/{id}/documents/{documentId}             204
GET    /api/v1/document-types                                        the type dropdown
```

**The version key is `(organization, docType, documentName)`.** Same pair again → version *n+1*, with
the previous demoted, not deleted. A different name is a different document at v1. `type=Other`
requires a name.

Documents uploaded here are stamped `source: COOP_INTERNAL`; the customer portal stamps
`COOP_CUSTOMER`. It is derived from the principal and can never be set by the client. It is **`null`
on everything uploaded before versioning shipped** — render "—", not "Internal". `uploadedByName` is
resolved at read time and is null if that user is gone.

`url` on each document is a **signed link** that opens without an `Authorization` header — usable in
an `<img>` tag and in a new tab. ~15 minutes; re-fetch rather than cache. `404` means reload.

**Business licences: an organization may hold several.** `documentName` names one and is its version
key. The organization counts as validated when its TIN is verified **and at least one current licence
is `VALIDATED`** — so attaching a second licence does not un-verify a trading company, while
replacing its only validated one does. Verification stamps **every** current licence, since eTrade
answers for the TIN rather than for one document.

**Who may upload:** bank staff on any organization; on their *own* organization a customer Admin **or
an INITIATE user**. That widening is additive — it does not remove any staff right, and a CSE can
still upload anywhere. **Deleting stays staff/Admin only**, because deleting a current version
removes its whole version chain.

### The company's users

```
GET  /api/v1/organizations/{id}/users?page=&size=
POST /api/v1/organizations/{id}/users
PUT  /api/v1/organizations/{id}/users/{userId}
POST /api/v1/organizations/{id}/users/{userId}/activate|deactivate|reset-password
```

Body: `{username, password, email, firstName, lastName, phone, gender, dateOfBirth, address, role,
permissionType}`. `role` is `Admin` or `User`; `permissionType` is `INITIATE` / `APPROVE` / `VIEW`.

Two gates, both `409`, both meaning "finish onboarding first":

- `ORG_NOT_VALIDATED` — TIN not verified, or no validated business licence.
- `ORG_CSE_REQUIRED` — no CSE assigned.

So the onboarding order is: create → assign CSE → verify TIN and licence → **then** add users.

### Profile changes reach CoopStream automatically

Every change to a company's profile — fields, documents, CSE, TIN verification — advances its
`profile_version` and queues a delivery to CoopStream's organization-profile webhook. A Postgres
outbox drains it on a schedule, retrying with exponential backoff forever, and **parks a `409`** for
a human because their contract says a duplicate or out-of-order version cannot be fixed by retrying.

No endpoint exposes this and nothing in the UI triggers it. It matters only because it explains why
an edit shows up in CoopStream shortly after you save, and that a parked row needs someone to look.

---

## 5. Signatory matrix — for any organization

**BankAdmin only** (`MANAGE_SIGNATORY_ANY`). Identical shapes to the customer-side routes, with the
org id in the path.

```
GET,POST       /api/v1/organizations/{orgId}/signatory-groups
GET,PUT        /api/v1/organizations/{orgId}/signatory-groups/{groupId}
POST           /api/v1/organizations/{orgId}/signatory-groups/{groupId}/activate|deactivate
GET,POST       /api/v1/organizations/{orgId}/signatory-groups/{groupId}/members
POST           /api/v1/organizations/{orgId}/signatory-groups/{groupId}/members/reorder
DELETE         /api/v1/organizations/{orgId}/signatory-groups/{groupId}/members/{memberId}

GET,POST       /api/v1/organizations/{orgId}/approval-rules
PUT,DELETE     /api/v1/organizations/{orgId}/approval-rules/{ruleId}
POST           /api/v1/organizations/{orgId}/approval-rules/{ruleId}/activate|deactivate
POST           /api/v1/organizations/{orgId}/matrix/simulate
POST           /api/v1/organizations/{orgId}/matrix/templates/{code}/apply
GET            /api/v1/organizations/{orgId}/matrix/audit
GET            /api/v1/organizations/{orgId}/matrix/authorized
GET            /api/v1/organizations/{orgId}/matrix/evaluations/{evaluationId}
GET            /api/v1/approval-types · /approval-features · /approval-policy-templates
```

Group members must be `APPROVE` users **of that organization** → `400 NOT_APPROVER`. Member **order
matters** for sequential rules.

**`/matrix/simulate` before saving.** It answers "who must sign a 5,000,000 ETB loan under this
configuration?" without creating one. A wrong matrix is otherwise discovered when a real request
fails.

`/matrix/evaluations/{id}` is readable by staff for oversight, but
`…/evaluations/{id}/approve|reject` exist **only on the customer side**. Bank staff do not sign.

> ⚠️ **Standing issue:** an organization with **no approval rules** does not fail closed. Treat matrix
> configuration as a required onboarding step and show an explicit warning on any company that has
> none.

---

## 6. Oversight

### Loan requests, on behalf

```
GET  /api/v1/organizations/{orgId}/loan-requests?page=&size=
POST /api/v1/organizations/{orgId}/loan-requests
GET  /api/v1/organizations/{orgId}/loan-requests/{id}
POST /api/v1/organizations/{orgId}/loan-requests/{id}/submit
GET  /api/v1/product-catalog?serviceType= · /business-types · /currencies · /loan-request-enums
```

Creating is possible, but **submit still runs the Signatory Matrix** — staff cannot sign it through,
and a request without a recorded PASS is never handed to CoopStream. Treat these as assisted capture,
not as a bypass.

### Loan processes in CoopStream

```
GET  /api/v1/loans/processes?includeClosed=&limit=&offset=
GET  /api/v1/loans/processes/{coopstreamApplicationId}
GET  /api/v1/loans/processes/{coopstreamApplicationId}/status
POST /api/v1/loans/processes/{coopstreamApplicationId}/deactivate
```

### Trade oversight

```
GET /api/v1/trade/processes?page=&size=
GET /api/v1/trade/processes/cse                  the ones assigned to the calling CSE
GET /api/v1/trade/processes/{processInstanceId}
GET /api/v1/trade-fx-options
```

### Engineer tasks — BankEngineer

```
GET  /api/v1/engineer/tasks/mine
GET  /api/v1/engineer/tasks/processes
GET  /api/v1/engineer/tasks/{taskId}
POST /api/v1/engineer/tasks/{taskId}/complete
POST /api/v1/engineer/tasks/{taskId}/complete-engineer-estimation
```

The engineer captures collateral data; an **AI service** returns the estimated value. That runs as a
CoopStream workflow step — this backend surfaces the task and takes the answer, it does not do the
valuation.

### RTGS acknowledgement — `ACKNOWLEDGE_RTGS`

```
GET  /api/v1/rtgs/transfers/awaiting-acknowledgement?page=&size=
GET  /api/v1/rtgs/transfers/{id}
POST /api/v1/rtgs/transfers/{id}/acknowledge
```

A customer's approved RTGS transfer waits here until a finance officer confirms settlement at the
other bank. This queue is the finance officer's whole screen — badge it from the first call.

---

## 7. Machine and downstream endpoints

Not called by the browser. Listed so you recognise them in logs.

```
GET  /api/v1/partner/account-lookup          X-TAS-Api-Key   partner (M2M) pre-check
POST /api/v1/partner/organizations           X-TAS-Api-Key   partner registration
POST /api/v1/auth/verify-token                              CoopStream introspects a user token
POST /api/v1/callbacks/coopstream/notify-customer-task      X-CoopStream-Secret
POST /api/v1/callbacks/coopstream/notify-engineer-task      X-CoopStream-Secret
GET  /api/v1/documents/{id}?expires=&signature=   public, HMAC-signed
```

Partner registration authenticates with a **shared API key**, not a JWT, and assigns the CSE by
e-mail rather than by id. There is deliberately **no partner add-accounts endpoint** — one shared key
must not be able to attach accounts to an existing company.

---

## 8. Endpoint index

109 routes outside `/my-organization`.

| group | endpoints | auth |
|---|---|---|
| **auth** | `POST /auth/login\|refresh` | public |
| | `GET /auth/me` · `POST /auth/change-password` | authenticated |
| **employees** | `GET,POST /employees` · `GET /employees/verify-cse\|verify-engineer` | `MANAGE_EMPLOYEES` |
| **roles** | `GET,POST /roles` · `GET,PUT /roles/{id}` · `POST /roles/{id}/activate\|deactivate` · `PUT /users/{userId}/roles` | `MANAGE_ROLES` |
| **permissions** | `GET /permissions` | `MANAGE_ROLES` or `MANAGE_PERMISSIONS` |
| **orgs — read** | `GET /organizations` · `GET /organizations/{id}` | `VIEW_` or `MANAGE_ORGANIZATIONS` |
| **orgs — write** | `POST /organizations` · `PUT,DELETE /organizations/{id}` · `/suspend\|activate\|terminate` · `/assign-cse` · `/verify-tin\|verify-manual\|revalidate` · `GET /organizations/account-lookup` | `MANAGE_ORGANIZATIONS` |
| **org accounts** | `GET /organizations/{id}/accounts[?includeUnselected=]` · `/accounts/linkable` | `MANAGE_ORGANIZATIONS` or `MANAGE_OWN_ORG` |
| | `POST /accounts` · `/accounts/refresh` · `/accounts/{id}/set-primary\|deselect` · `DELETE /accounts/{id}` | same |
| **org documents** | `GET /organizations/{id}/documents[?includeHistory=]` · `GET /documents/{docId}` | authenticated (service-scoped) |
| | `POST /documents` · `POST /business-license[?documentName=]` | staff, or own-org Admin/INITIATE |
| | `DELETE /documents/{docId}` | `MANAGE_ORGANIZATIONS`/`MANAGE_OWN_ORG` |
| **org users** | `GET,POST /organizations/{id}/users` · `PUT /users/{userId}` · `/activate\|deactivate\|reset-password` | `MANAGE_ORGANIZATIONS` or `MANAGE_OWN_ORG` |
| **matrix (any org)** | all `/organizations/{orgId}/signatory-groups…` and `…/approval-rules…` and `…/matrix/…` | `MANAGE_SIGNATORY_ANY` or `MANAGE_SIGNATORY_OWN` |
| **loans** | `GET,POST /organizations/{orgId}/loan-requests[/{id}][/submit]` | authenticated (INITIATE on write) |
| | `GET /loans/processes[/{id}][/status]` · `POST /loans/processes/{id}/deactivate` | authenticated |
| **trade** | `GET /trade/processes[/cse][/{id}]` · `GET /trade-fx-options` | authenticated |
| **engineer** | `GET /engineer/tasks/mine\|processes\|{id}` · `POST /engineer/tasks/{id}/complete[-engineer-estimation]` | authenticated (engineer) |
| **RTGS finance** | `GET /rtgs/transfers/awaiting-acknowledgement` · `GET /rtgs/transfers/{id}` · `POST /rtgs/transfers/{id}/acknowledge` | `ACKNOWLEDGE_RTGS` |
| **notifications** | `GET /notifications` · `/unread-count` · `POST /{id}/read` · `/read-all` | authenticated |
| **reference** | `/document-types` · `/product-catalog` · `/business-types` · `/currencies` · `/loan-request-enums` · `/approval-types` · `/approval-features` · `/approval-policy-templates` · `/banks` | authenticated |
| **machine** | `/partner/**` (API key) · `/auth/verify-token` · `/callbacks/coopstream/**` (secret) · `/documents/{id}` (HMAC) | see §7 |

**Postman:** the `Internal Portal — …` folders of
`backend/docs/postman/TAS-Corporate-Portal.postman_collection.json`. Run **Auth → Login** first.
