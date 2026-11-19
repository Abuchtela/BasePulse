# ClaimBot Arkiv schema

Project namespace: `claimbot`

Entity type: `funding_opportunity`

| Attribute | Arkiv type | Purpose |
| --- | --- | --- |
| `project` | `str` | Stable application namespace |
| `entity_type` | `str` | Opportunity record discriminator |
| `schema_version` | `i32` | Schema migration guard |
| `opportunity_id` | `str` | Stable application identifier |
| `status` | `str` | Queryable `open` state |
| `region` | `str` | `global`, `us`, or `other` |
| `target_project` | `str` | `claimbot`, `basepulse`, or `both` |
| `deadline_at` | `u64` | Exact deadline as Unix milliseconds |
| `verified_at` | `u64` | Official-source verification time as Unix milliseconds |

The JSON payload contains title, official source URL, eligibility list, ISO deadline, payout, fit explanation and smallest next step. No secrets, wallet keys or personal data belong in attributes or payload.

Canonical query:

```text
project == "claimbot" AND entity_type == "funding_opportunity" AND status == "open"
```

ClaimBot then filters the returned payload by target project and exact deadline. Reads should also be scoped to the submission creator address once the contest wallet is established.

