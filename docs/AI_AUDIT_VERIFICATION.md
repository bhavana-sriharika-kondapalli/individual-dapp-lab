
# Guided Lab 3 — Activity 9: AI Audit Verification

## Project
Individual DIDLab DApp — AnchorRegistry

## Purpose
This review independently checks the AI-generated findings
recorded in AI_AUDIT_RAW.md against the original AnchorRegistry
contract and local Hardhat tests.

The goal is to distinguish observed contract behavior from
confirmed security vulnerabilities and design decisions.

## Test Environment
- Solidity: 0.8.24
- Framework: Hardhat 3
- Test runner: node:test
- Ethereum library: Viem
- Network: Local Hardhat test environment
- Test file: test/ai-audit-verification.test.ts
- Result: 6 passing tests, 0 failures

## Verification Results

| ID | Observed behavior | Evidence | Assessment |
|---|---|---|---|
| AC-01 | Last administrator can revoke their own ADMIN role | Test passed | Confirmed administrative lockout risk |
| AC-02 | Arbitrary bytes32 role identifiers can be granted | Test passed | Confirmed behavior; limited direct security impact |
| AC-03 | Roles can be granted to the zero address | Test passed | Confirmed input validation weakness |
| IV-01 | Empty CID strings are accepted | Test passed | Confirmed; violates requirements if every anchor needs an IPFS reference |
| IV-02 | Zero record identifiers are accepted | Test passed | Confirmed; severity depends on identifier policy |
| IV-03 | Arbitrary strings can be stored as CIDs | Test passed | Confirmed; contract does not validate CID format |

## Findings Not Requiring Exploit Tests

### Reentrancy
The reviewed AnchorRegistry contract makes no external
contract calls or ETH transfers in its state-changing
functions. No direct reentrancy entry point was identified.

### Unchecked External Calls
No low-level external calls were found in the reviewed
contract, so unchecked external-call handling is not
applicable to this version.

### State Ordering
The verify() function requires an existing record,
rejects repeat verification, and prevents a submitter
from verifying their own record.

The Activity 7 tests also confirmed that unknown records
cannot be verified.

### Historical Records After Role Revocation
Existing records are not deleted when a role is revoked.
This is consistent with preserving historical blockchain
evidence. The behavior was identified through code review
but has not yet been separately regression-tested.

## What the AI Audit Missed

The original AI audit did not explicitly highlight that
grantRole() can assign the ADMIN role to additional
accounts without a separate approval or recovery process.

This is not an authorization bypass because the caller
must already have ADMIN privileges. However, compromise
of an ADMIN key could allow an attacker to grant
persistent administrative access.

The original audit also did not separately discuss the
absence of a mechanism for reversing an incorrect
verification. Whether that is a defect depends on
the intended append-only record policy.

## Conclusion

All six AI-reported behaviors were reproduced in local
Hardhat tests.

Their security impact varies. The most important
confirmed issue is potential permanent administrative
lockout. Input validation weaknesses also warrant
attention if they violate the application's data rules.

The next activity will apply justified security fixes,
run regression tests, and document any remaining risks.
