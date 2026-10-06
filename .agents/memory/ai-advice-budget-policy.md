---
name: AI advice budget policy
description: Conservative charge accounting and the meaning of the overall advice allowance.
---

Reserve allowance before an owner-funded provider call and do not refund failed or timed-out attempts. Keep the overall cumulative ceiling in addition to daily quotas; opening a new account or waiting for midnight must not bypass that ceiling.

**Why:** A timeout does not prove that Anthropic did not generate billable output. Public account creation means account-only quotas cannot protect the owner's balance. Request caps are not exact dollar accounting; they require bounded input/output.

**How to apply:** Share the same durable atomic reservations across all owner-funded advice entry points, leave successful cached advice free, and only increase the cumulative ceiling through an explicit operator configuration change. Do not claim monetary costs are measured by request counts.
