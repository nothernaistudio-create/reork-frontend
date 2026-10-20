# REORK AI | One-Workflow Implementation Pilot (PRIVATE DRAFT)

**Status:** Proposed service terms for discussion. Not a live offer, customer agreement, price, or completed client engagement. Do not publish, send, or imply a sale without owner approval.

## The outcome
Fix **one named business handoff** between tools the customer already owns. The job is not "install AI"; it is to make a defined event produce a verified destination result, with a safe exception path. First check whether the source/destination tools already offer this natively for free. If they do, recommend that route rather than charging to rebuild it.

## Example using existing REORK architecture (internal illustration, NOT a customer case study)
Source: a business inquiry received at the company's authorized inbox, identified by its provider message ID.
Destination: an intake task in the company's owned task database, storing only the source message ID and classification metadata, not private message bodies.
Expected: exactly one task for an eligible inquiry; no task for unrelated email; repeat processing does not create duplicates. A successful scheduled job alone is NOT acceptance.
REORK's matching frontend and backend are currently separate unmerged draft PRs. This example is an implementation pattern, not evidence of production delivery or a customer.

## Fixed-scope delivery boundary (to be completed before quote)
- **Trigger:** one event type from one source application, with an agreed stable event ID.
- **Destination:** one approved target application and one record type.
- **Field map:** explicit source-to-target fields, required values, transformations and validation.
- **Permissions:** customer-owned access; least privilege; no passwords or raw customer records in email.
- **Exceptions:** one agreed safe handling path for missing required data or target rejection.
- **Evidence:** redacted source event ID, target record ID and timestamp, plus one duplicate/retry case.
- **Handover:** configuration summary, test receipts, known limits and customer-operated rollback instructions.
- **Acceptance:** customer confirms a successful authorized test, a rejected/held bad-input test, and an idempotent retry against the actual destination. No payment/ROI claims from a green test suite.

## Client supplies
Names of the two applications, exact trigger, required destination state, estimated volume, one permitted redacted positive example, one negative example, existing native automation settings, account/API permission documentation, and the person authorized to accept results. Customer authorizes any actual connector use and production change separately.

## Excluded unless separately scoped
Bulk migration; ongoing monitoring/hosting; paid APIs or new subscriptions; third-party data scraping; regulated personal/medical/financial records; legal/compliance certification; outbound messages, purchases, payments or irreversible actions; 24/7 support; multiple workflows or extra destinations.

## Quote and delivery
**Price:** fixed quote only after input access, native feature coverage, integration limits and test environment are checked. No invented CAD fee or guaranteed hours saved. Scope and acceptance must be signed off before build. Asynchronous written review and delivery; no compulsory calls.

## Agency subcontract route (UNSENT)
An agency may supply a client-approved, redacted scope and retain the client relationship. REORK would quote one acceptance-tested handoff as a fixed deliverable. Agency confirms its client has authorized data access, subcontracting and any deployment. No unverified claim of agency clients, funding, payment or capacity.

## Client-facing draft sentence
"Send the exact repeated step, the two systems involved and what a finished result looks like. We'll first check whether your existing software already does it. If custom integration is justified, we'll return a written fixed-scope proposal with an acceptance test and no required discovery call."

## Next evidence gate
Find one current named buyer or agency with a specific open paid scope, verify funding and async terms, then request owner approval before sending. Separately verify a real source-message-ID to destination-task-ID pair before describing REORK's own inbound routing as live.
