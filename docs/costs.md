# Operating costs

**The implemented site needs no database: database cost is $0 at every traffic level.** Browser calculations and version-controlled content do not generate database reads or writes. Hosting, domain renewal, email, external data and future advertisements are separate.

Official pricing was checked October 9, 2026. Detailed assumptions and reproducible arithmetic are in [launch research](research/launch/launch-research.txt) and [cost examples](research/launch/cost-examples.json). No paid service was provisioned.

| Future persistence option | Mandatory monthly base | Relevant metering / tradeoff |
|---|---:|---|
| [Neon Launch](https://neon.com/pricing) | $0 | $0.106/CU-hour and $0.35/GB-month; no minimum. Retained storage/history can cost money while compute sleeps. Monthly billing is the closest researched match to the requested payment timing. |
| [Firestore Standard / Blaze](https://cloud.google.com/firestore/pricing) | $0 | In the modeled US region, $0.03/100k reads, $0.09/100k writes, $0.01/100k deletes, plus storage/network. Daily allowances matter. Cloud Billing may collect at thresholds before month-end. |
| [DynamoDB on demand](https://aws.amazon.com/dynamodb/pricing/) | $0 capacity floor | Example US East rates: $0.125/million read units and $0.625/million write units. Item size, consistency, storage and transfer are separate. More AWS administration. |
| [Upstash Redis PAYG](https://upstash.com/pricing/redis) | $0 without optional packs | $0.20/100k commands; storage above 1 GB $0.25/GB-month. Useful for a later cache, not needed now. |
| [Cloudflare D1 paid](https://developers.cloudflare.com/d1/platform/pricing/) | Workers Paid required | The $5/month Workers base means the paid path does not meet a strict zero-base database requirement. |

Illustrative future database workloads: 100k/10m/100m reads, 10k/100k/1m writes and 0.25/1/10 stored billing-unit GB per month:

| Model | Low | Medium | Higher |
|---|---:|---:|---:|
| Current architecture: no DB | $0 | $0 | $0 |
| Firestore modeled total | $0 | $2.55 | $41.49 |
| Neon compute + storage | $0.1935 | $10.95 | $80.88 |
| DynamoDB requests only | $0.01875 | $1.3125 | $13.125 |

These are not traffic forecasts or comparable provider quotes. Neon independently assumes 1/100/730 CU-hours; requests do not predict compute. Firestore assumes uniform usage over 30 days, qualifying daily allowances, 1 KiB/read and specified US/Europe egress; the higher estimate includes egress. DynamoDB excludes storage and network. Backups, history, taxes, support and other account usage can add charges.

## Hosting separately

Private Sites account pricing and commercial terms are not established by this project; do not infer them from Cloudflare pricing. No fixed hosting price is promised.

For an external comparison, [Firebase App Hosting](https://firebase.google.com/docs/app-hosting/costs) meters bandwidth, Cloud Run, builds, artifacts, logs and related services on Blaze. A **bandwidth-only** scenario of 100k/1m/10m HTTP requests at 50 KiB each, 90% cached, with the shared 10 GiB allowance yields roughly $0/$5.84/$72.36. Compute and other charges must be added. Page views can make many HTTP requests.

[Vercel Hobby](https://vercel.com/docs/plans/hobby) is for personal non-commercial use. [Pro](https://vercel.com/pricing) has a $20/month base plus applicable usage. [Workers Paid](https://developers.cloudflare.com/workers/platform/pricing/) has a $5/month base. Those are hosting charges and should be assessed separately from the zero-base database requirement.

Before public traffic, verify the actual plan, commercial terms, cache behavior and data-provider reuse terms. Configure spending alerts and rate controls supported by that account; an alert is not a hard spending cap. No billing account settings were changed here.
