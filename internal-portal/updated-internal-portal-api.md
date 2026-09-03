# Internal Portal — Updated API (employees + org onboarding + signatory matrix v2)

Frontend integration guide for the **internal portal (bank staff)** covering the three areas that
changed: **(0) employee registration** — CSE/engineer ids verified against CoopStream; **(1)
organization onboarding** — now core-banking-driven; and **(2) the Signatory / Approval Matrix v2** —
AND/OR condition trees, validation, simulation, audit, templates.

- **Base URL:** all paths under `/api/v1`. Send `Authorization: Bearer <access token>`.
- **Who:** bank staff. Employee mgmt needs **`MANAGE_EMPLOYEES`**; registration & org-scoped matrix
  config need **`MANAGE_ORGANIZATIONS`** / **`MANAGE_SIGNATORY_ANY`** (BankAdmin). Read-only needs
  `VIEW_ORGANIZATIONS`.
- **Errors:** JSON `{ timestamp, status, error, code, message, path }`. Branch on `status` + `code`.

> A note on the CoopStream identity handshake (server-to-server, not a screen you build): when
> CoopStream introspects a token via `verify-token`, the returned `userId` is **role-dependent** — a
> BankEngineer resolves to their `engineerSystemId`, a BankCSE to their `crmSystemId`, and everyone else
> to our system UUID. This is why capturing those ids at employee creation (§0) matters end-to-end.

---

# 0. Employee registration — CSE & Engineer ids (CHANGED)

`POST /api/v1/employees` — `MANAGE_EMPLOYEES`. A CSE carries a **`crmSystemId`** and an Engineer a
**`engineerSystemId`** (both are the user's CoopStream id). Each is **required for that role, unique, and
validated against CoopStream before the user is created** — an unvalidated id is rejected (no user added).

```json
// BankCSE
{ "username": "cse.jane", "password": "≥8 chars", "email": "jane@cbo.et", "firstName": "Jane",
  "lastName": "Doe", "phone": "+2519…", "crmSystemId": "CSE-0001", "roles": ["BankCSE"] }

// BankEngineer
{ "username": "eng.mike", "password": "≥8 chars", "email": "mike@cbo.et", "firstName": "Mike",
  "lastName": "Field", "phone": "+2519…", "engineerSystemId": "ENG-0001", "roles": ["BankEngineer"] }
```

## 0.1 Verify the id first (block / prefill)
Before submitting create, call the live CoopStream verify endpoint for the entered id:

- `GET /api/v1/employees/verify-cse?systemId={crmSystemId}`
- `GET /api/v1/employees/verify-engineer?systemId={engineerSystemId}`

Both require `MANAGE_EMPLOYEES` and return:
```json
{ "valid": true, "systemId": "crm15532919", "groups": ["cse-group"],
  "firstName": "Jane", "lastName": "Doe", "fullName": "Jane Doe", "email": "jane@cbo.et" }
```
- **`valid: false`** → **block** the Create button and show "no valid user with that id".
- **`valid: true`** → enable Create; optionally **prefill** `firstName`/`lastName`/`email` from the response.
- `400 SYSTEM_ID_REQUIRED` if `systemId` is blank.

> These verify endpoints call CoopStream **live** regardless of the `validate-users` toggle (they're an
> explicit check). The create endpoint still re-validates and enforces per the toggle.

## 0.2 Create rules & errors
| Condition | Error |
|---|---|
| BankCSE without `crmSystemId` | `400 CRM_ID_REQUIRED` |
| BankEngineer without `engineerSystemId` | `400 ENGINEER_ID_REQUIRED` |
| id already used | `409 CRM_ID_EXISTS` / `409 ENGINEER_ID_EXISTS` |
| CoopStream says the id is not a valid CSE/engineer | `400 CSE_NOT_VALIDATED` / `400 ENGINEER_NOT_VALIDATED` |
| username taken | `409 USERNAME_TAKEN` |

`EmployeeResponse` = `{ id, username, email, firstName, lastName, phone, crmSystemId, engineerSystemId,
status, roles }`. `GET /api/v1/employees` lists them (paged). A non-CSE/non-engineer role may omit both ids.

> **UI:** show a `crmSystemId` field when `BankCSE` is selected and an `engineerSystemId` field when
> `BankEngineer` is selected; surface the validation errors above (esp. `*_NOT_VALIDATED`).
> **Backend note:** validation only calls CoopStream when it's enabled server-side
> (`TAS_COOPSTREAM_VALIDATE_USERS=true`); when off, ids are accepted without the CoopStream check.

---

# 1. Organization onboarding (CHANGED)

**Old flow (gone):** the admin typed an `accounts[]` array on create.
**New flow:** the admin enters **one account number**; the backend resolves it to a Core Banking
**`customerId`** and **auto-registers every account** of that customer. No manual account entry.

The UI does two steps: **look up the account → confirm → create**.

## 1.1 Account lookup (validate + capture customerId)  — do this first
`GET /api/v1/organizations/account-lookup?accountNumber={acct}` — `MANAGE_ORGANIZATIONS`.

Validates the account against Core Banking and previews the customer + accounts, **without writing**.

**200 OK**
```json
{
  "found": true,
  "accountNumber": "1037000041647",
  "customerId": "1014049132",
  "customerName": "Setegn Belay Zewude",
  "accounts": [
    { "accountNo": "1037000041647", "currency": "ETB", "accountType": "Farmers Savings Account", "status": "Active" }
  ]
}
```
- `found: true` + a `customerId` → valid; show `customerName` and the `accounts` that will be registered.
- `found: false` → account not recognized by core; **block the Create button** and show "account not found".
- `400 ACCOUNT_REQUIRED` if `accountNumber` is blank.

**Keep the returned `customerId`** — you must send it back on create (step 1.2).

## 1.2 Create organization (multipart)
`POST /api/v1/organizations` — `MANAGE_ORGANIZATIONS` — **`multipart/form-data`** with two parts:

| Part | Type | Notes |
|---|---|---|
| `data` | application/json | the JSON below |
| `businessLicense` | file | **optional** (PDF/PNG/JPG) |

`data` JSON:
```json
{
  "name": "Setegn Belay Zewude",
  "accountNumber": "1037000041647",
  "customerId": "1014049132",
  "tin": "1234567890",
  "phone": "+251911111111",
  "address": "Bole, Addis Ababa",
  "crmSystemId": "CSE-0001",
  "description": "Corporate customer",
  "assignedCseUserId": null
}
```
- **`accountNumber`** and **`customerId`** are both **required** — `customerId` is the value from 1.1.
- **No `accounts[]`.** The backend re-resolves the account and **auto-registers** all of the customer's
  accounts (the seed account becomes primary).
- **Anti-tamper:** the backend re-checks that `customerId` matches the account. Errors:
  - `400 CUSTOMER_ID_REQUIRED` — `customerId` missing.
  - `400 CBS_ACCOUNT_NOT_FOUND` — account not in core.
  - `400 CBS_CUSTOMER_MISMATCH` — `customerId` ≠ the account's real customer.

**201** returns the organization (`OrganizationResponse`) including **`cbsCustomerId`** (captured) and
`accounts[]` (auto-registered). Confirm capture by checking `cbsCustomerId` is non-null.

## 1.3 Accounts are core-driven (no manual add/edit)
Accounts come from core; the admin cannot add or edit account numbers.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/organizations/{orgId}/accounts` | list the org's registered accounts |
| POST | `/api/v1/organizations/{orgId}/accounts/refresh` | re-fetch from core by the stored customerId (registers any new ones) |
| POST | `/api/v1/organizations/{orgId}/accounts/{accountId}/set-primary` | choose the primary |
| DELETE | `/api/v1/organizations/{orgId}/accounts/{accountId}` | hide an account |

> **Removed:** `POST …/accounts` (add) and `PUT …/accounts/{id}` (edit) — don't call them. Account
> `id` values come from the list/response; `AccountResponse` = `{ id, accountNo, currency, accountType, primary }`.

The rest of org management (list/get/update profile, suspend/activate/terminate, assign CSE, verify
TIN, users, documents) is unchanged.

---

# 2. Signatory / Approval Matrix v2 (CHANGED)

The matrix decides **who must approve which request, at which amount, under which conditions**, per
organization. Bank staff configure it under **`/api/v1/organizations/{orgId}/**`**. A rule now carries a
recursive **AND/OR condition tree** of signatory groups instead of a single group.

## 2.1 Signatory groups + members
Base: `/api/v1/organizations/{orgId}/signatory-groups`.

| Method | Path | Purpose |
|---|---|---|
| GET / POST | `` | list / create groups (`{ name, description }`) |
| GET / PUT | `/{groupId}` | get / rename |
| POST | `/{groupId}/activate` · `/deactivate` | status |
| GET / POST | `/{groupId}/members` | list / add member (`{ userId }`) — user must be an `APPROVE` user of the org |
| DELETE | `/{groupId}/members/{memberId}` | remove member |
| POST | `/{groupId}/members/reorder` | `{ "orderedUserIds": ["…","…"] }` (a permutation of current members) |

`SignatoryGroupResponse` = `{ id, organizationId, name, description, status, members (count), rules (count) }`.
`GroupMemberResponse` = `{ id, userId, username, email, fullName, approvalOrder }`.

## 2.2 Approval rules (rich model + condition tree)
Base: `/api/v1/organizations/{orgId}/approval-rules`.

| Method | Path | Purpose |
|---|---|---|
| GET | `?type={ApprovalType}&groupId={uuid}` | list (filters optional) |
| POST | `` | create (**201**) |
| PUT | `/{ruleId}` | update |
| DELETE | `/{ruleId}` | soft-delete |
| POST | `/{ruleId}/activate` · `/deactivate` | status |

**Create/Update body** (`CreateApprovalRuleRequest`):
```json
{
  "approvalType": "LOAN_APPLICATION",      // LOAN_APPLICATION | TRADE_REQUEST | FUND_TRANSFER | RTGS
  "approvalAction": "CREATE",              // CREATE | UPDATE | CANCEL
  "transactionType": "PER_TRANSACTION",   // PER_TRANSACTION | AGGREGATE_DAILY | AGGREGATE_MONTHLY (default PER_TRANSACTION)
  "rangeType": "BETWEEN",                  // UPTO | ABOVE | BETWEEN (derived from band if omitted)
  "minAmount": 100000,
  "maxAmount": 2000000,
  "currency": "ETB",                       // optional; loans ETB, trade uses request currency
  "sequencing": "SEQUENTIAL",              // SEQUENTIAL | PARALLEL (default SEQUENTIAL)
  "approvalRequired": true,                // false => a matching txn auto-approves (no signatories)
  "signatoryGroupId": "…uuid…",            // shorthand: all active members of ONE group must approve
  "conditionTree": null,                   // OR send a full tree instead of signatoryGroupId (see §2.3)
  "escalation": { "timeoutHours": 24, "escalateTo": "Group B" },   // optional; stored only for now
  "effectiveFrom": null,
  "effectiveTo": null
}
```
Send **either** `signatoryGroupId` (single-group shorthand → all its active members) **or** a
`conditionTree` (AND/OR of groups). `ApprovalRuleResponse` echoes everything back **fully populated**
(min/max/rangeType/conditionTree included) so the edit form never shows `undefined`:
```json
{ "id":"…","organizationId":"…","approvalType":"LOAN_APPLICATION","approvalAction":"CREATE",
  "transactionType":"PER_TRANSACTION","rangeType":"BETWEEN","minAmount":100000,"maxAmount":2000000,
  "currency":"ETB","sequencing":"SEQUENTIAL","approvalRequired":true,"status":"ACTIVE",
  "signatoryGroupId":"…","signatoryGroupName":"Group A",
  "conditionTree": { "type":"GROUP","groupId":"…","minApprovals":1 },
  "escalation": null, "effectiveFrom": null, "effectiveTo": null }
```

**Config-time validation — the API rejects (hard block):**
- `409 OVERLAPPING_RULE` — bands overlap for the same type/action/transactionType/currency.
- `400 COVERAGE_GAP` — a hole between two configured bands (e.g. nothing between 100,000 and 150,000).
- `400 INSUFFICIENT_APPROVERS` — a leaf needs more approvals than its group has active members.
- `400 EMPTY_CONDITION` — `approvalRequired=true` with no group leaf.
- `400 INVALID_BAND` — `minAmount > maxAmount`.

Surface `message` inline on the form.

## 2.3 The condition tree
Recursive JSON. Leaves require N approvals from a group; `AND` = all children, `OR` = any child. The
builder UI produces the two-level shape (OR of conditions, each an AND of group leaves):
```json
{ "type": "OR", "children": [
    { "type": "AND", "children": [
        { "type": "GROUP", "groupId": "A", "minApprovals": 1 },
        { "type": "GROUP", "groupId": "B", "minApprovals": 2 } ] },
    { "type": "GROUP", "groupId": "C", "minApprovals": 1 } ] }
```

## 2.4 Evaluations (the approval queue is on the customer side; bank can view/act)
Base: `/api/v1/organizations/{orgId}/matrix`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/evaluations/{evaluationId}` | one evaluation + ordered `steps` |
| POST | `/evaluations/{evaluationId}/approve` · `/reject` | a signatory decides (`{ "comment": "…" }` optional) |
| GET | `/authorized?requestRef={ref}` | `{ "authorized": true|false }` (the PASS gate) |

`MatrixEvaluationResponse` = `{ id, organizationId, requestRef, approvalType, approvalAction, amount,
currency, result (PENDING|PASS|FAIL), reason, matchedRuleId, signatoryGroupId, evaluatedAt, steps[] }`;
`steps[]` = `{ id, userId, username, fullName, approvalOrder, decision (PENDING|APPROVED|REJECTED),
decidedAt, comment }`. PASS = the request may be triggered downstream.

## 2.5 Simulation ("Test this configuration")
`POST /api/v1/organizations/{orgId}/matrix/simulate` — runs a hypothetical through the **real engine**,
no persistence.
```json
// request
{ "approvalType":"LOAN_APPLICATION","approvalAction":"CREATE","amount":1500000,"currency":"ETB",
  "transactionType":"PER_TRANSACTION" }          // + optional at/dailyTotal/monthlyTotal for aggregate rules
// 200
{ "approvalRequired": true, "ambiguous": false, "matchedRuleId": "…", "reason": "Matched rule … [100000-2000000 ETB]",
  "requiredCondition": { "type":"GROUP","groupId":"…","minApprovals":2 },
  "involvedGroups": [ { "groupId":"…","name":"Group A","minApprovals":2,"eligibleActiveMembers":3,"sufficient":true } ] }
```

## 2.6 Audit history
`GET /api/v1/organizations/{orgId}/matrix/audit` → most-recent-first list of every group/member/rule
change: `{ id, entityType, entityId, action (CREATE|UPDATE|DELETE), before, after, summary, changedBy,
changedByName, changedAt }` (`before`/`after` are JSON snapshots). Render as an "Audit History" panel.

## 2.7 Templates + reference lists
- `GET /api/v1/approval-policy-templates` → starter policies `{ code, name, description, rules[] }`
  (SME Standard, Corporate High-Value).
- `POST /api/v1/organizations/{orgId}/matrix/templates/{code}/apply` — body `{ "defaultSignatoryGroupId": "…" }`
  → creates the template's bands as rules (approvers default to that group). Returns the created rules.
- `GET /api/v1/approval-features` → data-driven feature catalog `{ code, label, approvalType, monetary }`.
- `GET /api/v1/approval-types` → `{ approvalTypes:[{value,label}], approvalActions:[{value,label}] }`.
- `GET /api/v1/currencies` → currency enum for trade rules.

---

## Frontend checklist (internal portal)
- [ ] Onboarding: **account number field + a Look-up button** → call `account-lookup`; on `found`, show
      `customerName` + `accounts`, keep `customerId`, enable Create; on `!found`, block with an error.
- [ ] Create org is **multipart** (`data` JSON + optional `businessLicense`); send `accountNumber` **and**
      `customerId`; handle `CUSTOMER_ID_REQUIRED` / `CBS_ACCOUNT_NOT_FOUND` / `CBS_CUSTOMER_MISMATCH`.
- [ ] Accounts screen: **no add/edit** — list + refresh + set-primary + delete only.
- [ ] Matrix: group builder, rule form with the **AND/OR condition-tree builder**, inline validation
      errors (overlap/gap/insufficient/empty), **Simulate** panel, **Audit History** panel, **Apply template**.
- [ ] Rule edit reads the full `ApprovalRuleResponse` (min/max/rangeType/conditionTree present).
