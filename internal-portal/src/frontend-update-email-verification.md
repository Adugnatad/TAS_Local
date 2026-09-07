# Frontend update — e-mail-based CSE / Engineer verification

CSE and engineer verification is now **e-mail-based**, not id-based. CoopStream added an optional
`email` field to its verify endpoints.

---

## TL;DR

1. **Verify by e-mail, not id.** `GET /verify-cse` / `GET /verify-engineer` now take `?email=` (was
   `?systemId=`), and the verify **response shape changed** (see §2).
2. **Employee create** (`POST /api/v1/employees`) now keys verification off `email` (required for a
   `BankCSE`/`BankEngineer`). `crmSystemId` / `engineerSystemId` are now **optional metadata** (still
   unique if sent, still forwarded to CoopStream) — they are no longer required and no longer verified.
3. **Org registration assigns a CSE by identity.** Internal admin picks an existing CSE
   (`assignedCseUserId`). The selected CSE's e-mail is re-verified before
   assignment. The org no longer accepts a CSE `crmSystemId` as the selector.

---

## 1. Verify a CSE / engineer before creating — internal portal (`MANAGE_EMPLOYEES`)

```
GET /api/v1/employees/verify-cse?email=jane.cse@coopbank.et
GET /api/v1/employees/verify-engineer?email=sam.eng@coopbank.et
```

- `verify-cse` calls **CoopStream + eTrade**.
- `verify-engineer` calls **CoopStream only**.

> The query param is now **`email`** (was `systemId`). Update the field the form posts.

## 2. Verify response — new shape

```json
{
  "valid": true,
  "email": "jane.cse@coopbank.et",
  "groups": ["BankCSE"],
  "fullName": "Jane Doe",
  "coopStreamValid": true,
  "etradeChecked": true,
  "etradeValid": true
}
```

| Field             | Type           | Notes                                                            |
| ----------------- | -------------- | ---------------------------------------------------------------- |
| `valid`           | bool           | Final verdict — block the "create" button when `false`.          |
| `email`           | string         | The e-mail that was checked.                                     |
| `groups`          | string[]       | CoopStream groups (for display).                                 |
| `fullName`        | string \| null | Prefill the name fields.                                         |
| `coopStreamValid` | bool           | CoopStream's verdict.                                            |
| `etradeChecked`   | bool           | `true` for CSE (eTrade consulted), `false` for engineer.         |
| `etradeValid`     | bool           | eTrade directory verdict (meaningful only when `etradeChecked`). |

**UX:** when `valid` is `false`, use the two source flags to explain why — e.g. "Found in CoopStream
but not in eTrade" (`coopStreamValid && !etradeValid`) or "Not found in CoopStream".

> Removed vs. the old response: `systemId`, `firstName`, `lastName`. Use `email` + `fullName`.

## 3. Create a CSE / Engineer employee — `POST /api/v1/employees`

```json
{
  "username": "cse.jane",
  "password": "CsePassw0rd!",
  "email": "jane.cse@coopbank.et",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+251911000000",
  "roles": ["BankCSE"]
}
```

- **`email` is required** for a `BankCSE` or `BankEngineer` — it is the verification key.
- `crmSystemId` (CSE) / `engineerSystemId` (engineer) are **optional** now; include them only if you
  want to store the CoopStream id metadata (still unique if provided).
- On create the backend re-verifies: **CSE → CoopStream + eTrade**, **engineer → CoopStream**. A failure
  rejects the create (no user added).

**Errors**

| Code                     | HTTP | When                                                   |
| ------------------------ | ---- | ------------------------------------------------------ |
| `EMAIL_REQUIRED`         | 400  | Creating a `BankCSE`/`BankEngineer` without an `email` |
| `CSE_NOT_VALIDATED`      | 400  | CSE e-mail failed CoopStream + eTrade verification     |
| `ENGINEER_NOT_VALIDATED` | 400  | Engineer e-mail failed CoopStream verification         |
| `CRM_ID_EXISTS`          | 409  | `crmSystemId` already used (only if you sent one)      |
| `ENGINEER_ID_EXISTS`     | 409  | `engineerSystemId` already used (only if you sent one) |

> Gone: `CRM_ID_REQUIRED`, `ENGINEER_ID_REQUIRED` (ids are optional now).

## 4. Added Field on Org registration

- | alwaysUseSellingPriceForFCYConvertion | optional | Boolean; when true, FCY conversions for this customer always use the selling price. Defaults to false. |
- The org no longer accepts a CSE `crmSystemId` as the selector.

## Migration checklist (frontend)

- [ ] Employee verify calls: rename query param `systemId` → `email` on both verify endpoints.
- [ ] Map the **new verify response** (`valid`, `coopStreamValid`, `etradeChecked`, `etradeValid`,
      `fullName`, `email`); drop `systemId`/`firstName`/`lastName` usage.
- [ ] CSE/Engineer create form: make **`email`** required for those roles; make `crmSystemId` /
      `engineerSystemId` optional; handle `EMAIL_REQUIRED`.
- [ ] Org registration has 'alwaysUseSellingPriceForFCYConvertion' field and no longer accepts a crmSystemId as the selector.
