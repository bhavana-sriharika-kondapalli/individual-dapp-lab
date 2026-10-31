
# Guided Lab 3 — Raw AI Security Audit

## Audit Information
- Contract: AnchorRegistry.sol
- Solidity version: 0.8.24
- Network: DIDLab (Chain ID 252501)
- Review method: AI-assisted static source-code review
- Scope: Contract source supplied in ChatGPT
- Status: Initial findings, not independently verified
- Important: No automated scanner was executed.

## 1. Access Control

Finding AC-01: Last administrator can revoke their own ADMIN role.

Severity: Medium
Location: revokeRole()

The contract does not prevent the final administrator
from revoking their own ADMIN role.

If no administrators remain, role administration becomes
unavailable through the contract's public functions.

Recommendation:
Prevent removal of the last administrator or implement
a documented administrative recovery mechanism.

Finding AC-02: Arbitrary role identifiers are accepted.

Severity: Low
Location: grantRole(), revokeRole()

An administrator can grant or revoke arbitrary bytes32
role identifiers, including roles not used by the contract.

This does not independently allow an unauthorized user
to acquire privileges.

Recommendation:
Consider restricting role identifiers to recognized roles.

Finding AC-03: Zero-address role assignments are accepted.

Severity: Low
Location: grantRole()

The contract permits granting roles to address(0).
This creates an unusable assignment and may cause
administrative mistakes.

Recommendation:
Reject zero-address role recipients.

## 2. Input Validation

Finding IV-01: Empty IPFS CID is accepted.

Severity: Medium
Location: anchor()

The function validates the document digest but does not
require a nonempty CID.

An authorized submitter can create a record without an
IPFS content reference.

Recommendation:
Reject empty CIDs if every anchored record must link
to an off-chain document.

Finding IV-02: Zero record identifier is accepted.

Severity: Low
Location: anchor()

The contract does not reject bytes32(0) as recordId.

This may conflict with application-level requirements
for valid identifiers.

Recommendation:
Reject zero record IDs if they are invalid by design.

Finding IV-03: CID format is not validated.

Severity: Low
Location: anchor()

The contract accepts arbitrary strings as CID values.
It does not validate whether the value is a valid IPFS CID.

Recommendation:
Validate CID format in the frontend or backend.
Consider minimal on-chain constraints if required.

## 3. Reentrancy

Finding RE-01: No apparent reentrancy entry point.

Severity: Informational

The contract does not send ETH or make external contract
calls in its state-changing functions.

No direct reentrancy vulnerability was identified
in the supplied source.

Recommendation:
Retest if future versions introduce external calls.

## 4. Unchecked External Calls

Finding EC-01: No unchecked external calls identified.

Severity: Informational

The contract does not use call, delegatecall,
staticcall, send, or transfer to interact with
external contracts.

Recommendation:
Review any external integrations added later.

## 5. State Ordering

Finding SO-01: Verification is restricted to existing,
unverified records.

Severity: Informational
Location: verify()

The contract checks that a record exists, prevents
repeat verification, and prevents a submitter from
verifying their own record.

No direct ordering vulnerability was identified.

Finding SO-02: Role revocation does not invalidate
previously anchored or verified records.

Severity: Informational
Location: revokeRole()

Records remain anchored or verified after a user's role
is revoked.

This may be intended because blockchain records
represent historical actions.

Recommendation:
Document the intended behavior and test it.

## Initial AI Audit Summary

Potential findings requiring validation:
- AC-01: Last-admin lockout
- AC-02: Arbitrary role identifiers
- AC-03: Zero-address role grants
- IV-01: Empty CID
- IV-02: Zero record ID
- IV-03: Unvalidated CID format

Other observations:
- No direct reentrancy issue identified.
- No unchecked external calls identified.
- Existing verification ordering checks appear appropriate.
- Historical records persist after role revocation.

All findings require independent validation before
being classified as confirmed vulnerabilities.
