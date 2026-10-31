# Guided Lab 3: Adversarial Security Audit
## Security Review Report

**Project:** Chuck and Verify — Individual DApp Lab  
**Contract Reviewed:** AnchorRegistry.sol  
**Blockchain Network:** DIDLab  
**Chain ID:** 252501  
**Solidity Version:** 0.8.24  
**Review Date:** October 31, 2026

---

## 1. Introduction

In this lab, I examined how security weaknesses can affect Ethereum smart contracts and how those weaknesses can be identified through testing. I began by working with a deliberately insecure vault contract, then studied how to protect similar functionality using safer Solidity programming techniques.

After completing the initial exercises, I reviewed the AnchorRegistry contract used in my blockchain application. My main goal was to identify security concerns, reproduce suspicious behavior through tests, implement appropriate corrections, and verify that the application continued working after those changes.

The audit focused on access control, input validation, reentrancy, external contract interactions, and the order in which contract state is updated.

## 2. Contracts and Files Examined

The security exercises involved four Solidity contracts.

**VulnerableVault.sol:** This contract intentionally contained security weaknesses. I used it to investigate unauthorized ownership changes and unsafe withdrawal behavior.

**Reenterer.sol:** This contract was designed to test whether a withdrawal operation could be called repeatedly before the original operation finished.

**SafeVault.sol:** This contract demonstrated safer approaches to authorization, withdrawals, and external calls.

**AnchorRegistry.sol:** This was the main application contract. I reviewed its role management, record submission, and verification functions.

All attack demonstrations involving VulnerableVault were performed in the local Hardhat testing environment rather than on the live DIDLab network.

## 3. Initial Vulnerability Experiments

### 3.1 Unauthorized Ownership Changes

The first attack exercise examined a vault that allowed its owner to be changed without checking who requested the change.

During testing, an unauthorized account successfully became the contract owner and used the available withdrawal functionality to remove the vault's funds.

The test began with a vault balance of 5 test ETH. After the attack, the vault balance was zero.

This demonstrated how missing authorization checks can allow an ordinary user to gain administrative control over a contract.

### 3.2 Reentrancy Experiment

The next exercise focused on a withdrawal function that transferred ETH before updating the sender's balance. This creates a reentrancy risk because a receiving contract can call the withdrawal function again while the original transaction is still running.

I tested this vulnerability using the Reenterer contract on the local Hardhat network. During the first attempt, Solidity's arithmetic checks caused the transaction to revert. To demonstrate the underlying vulnerability, I updated the intentionally insecure VulnerableVault contract to use an unchecked balance subtraction.

After this change, the reentrancy attack succeeded. The attacker deposited 1 test ETH and received 2 test ETH through repeated withdrawal calls. The vault initially contained 5 test ETH and had 4 test ETH remaining after the attack.

This demonstrated that sending funds before updating internal balances can allow an attacker to withdraw more than their recorded balance. The exercise also showed why Solidity's arithmetic checks can affect the outcome of an exploit.

The vulnerability was addressed separately in SafeVault by updating the balance before transferring ETH, using a reentrancy guard, and checking whether the external transfer succeeded.

All attack demonstrations were performed locally. The intentionally vulnerable contract was not deployed to DIDLab.

### 3.3 Testing the Improved Vault

I then examined SafeVault, which included stronger authorization and withdrawal protections.

Four tests were executed successfully:

1. Unauthorized users could not change ownership.
2. The zero address could not become the owner.
3. A reentrancy attempt was blocked.
4. Authorized deposits and withdrawals continued to work.

These results showed that the tested security protections did not prevent normal vault operations.

## 4. AnchorRegistry Security Assessment

After completing the vault exercises, I reviewed the AnchorRegistry contract used in my application.

The contract allows authorized submitters to anchor records and authorized verifiers to confirm them. An administrator manages the permissions assigned to different accounts.

I examined each state-changing operation and considered how it might behave when called by an unauthorized user or supplied with unexpected input.

### 4.1 Access Control

The original contract restricted administrative functions to accounts with the ADMIN role. However, additional testing identified several cases that needed stronger safeguards.

One important issue involved an administrator revoking their own permissions when they were the only remaining administrator. This could leave the contract without an account capable of managing roles.

I also tested the handling of unsupported role identifiers and attempts to assign roles to the zero address.

### 4.2 Input Validation

The original record submission function rejected empty digests and duplicate records.

However, additional tests showed that it accepted an empty IPFS CID and a zero-valued record identifier.

The contract also accepted arbitrary CID strings without checking whether they followed an expected format.

These behaviors were documented because incomplete input validation can reduce the reliability of the information recorded by an application.

### 4.3 Reentrancy and External Calls

I reviewed the AnchorRegistry functions for external transfers and interactions with untrusted contracts.

Unlike the deliberately vulnerable vault, the reviewed AnchorRegistry functions did not transfer ETH to external recipients or invoke untrusted contracts.

Therefore, I did not identify the same external-call reentrancy pattern in the reviewed AnchorRegistry implementation.

### 4.4 Transaction Ordering

The anchoring and verification functions were also examined to determine whether their checks occurred before important state changes.

The original contract already prevented duplicate anchoring, repeated verification, and verification by the same account that submitted a record.

These existing protections were retained during the security improvements.

## 5. Findings and Verification Results


I identified six security concerns while reviewing the original AnchorRegistry contract. I investigated these issues using adversarial tests and checked the implemented fixes using regression tests.

| Finding | Vulnerability Class | Severity | Observation | Status |
|---|---|---|---|---|
| AC-01 | Access control | High | The last administrator could revoke their own ADMIN role, leaving the contract without an administrator. | Fixed |
| AC-02 | Access control | Medium | The contract accepted unsupported role identifiers, potentially creating unintended permissions. | Fixed |
| AC-03 | Access control | Medium | An administrator could assign roles to the zero address, creating unusable role assignments. | Fixed |
| IV-01 | Input validation | Low | The anchor function accepted an empty IPFS CID. | Fixed |
| IV-02 | Input validation | Medium | The anchor function accepted a zero-valued record identifier. | Fixed |
| IV-03 | Input validation | Low | The contract accepted arbitrary CID strings without validating their format. | Accepted residual risk |

The original contract's behavior was investigated through adversarial testing. After applying the fixes, I ran the security regression tests to verify that the corrected contract rejected the previously accepted invalid operations.

Five findings were addressed in the updated contract. IV-03 remains unresolved because the application currently treats the CID as a reference string rather than verifying its structure on-chain. I documented this limitation as an accepted risk for the lab implementation. Future improvements could include CID format checks in the application and additional off-chain validation.

The regression tests confirmed that the implemented protections worked without breaking normal record submission and verification.

## 6. AI-Assisted Review

I used ChatGPT to perform an initial security review of the original AnchorRegistry contract. The review examined access control, input validation, reentrancy, unchecked external calls, and state-ordering issues.

I saved the initial AI-generated findings in `docs/AI_AUDIT_RAW.md` and documented my verification work in `docs/AI_AUDIT_VERIFICATION.md`.

### 6.1 Verification of AI Findings

The AI identified six potential issues. I investigated them using the contract source and adversarial tests.

| Finding | AI Observation | Verification Result |
|---|---|---|
| AC-01 | The last administrator could revoke their own ADMIN role. | Confirmed; fixed |
| AC-02 | Unsupported role identifiers were accepted. | Confirmed; fixed |
| AC-03 | Roles could be granted to the zero address. | Confirmed; fixed |
| IV-01 | Empty IPFS CIDs were accepted. | Confirmed; fixed |
| IV-02 | Zero-valued record identifiers were accepted. | Confirmed; fixed |
| IV-03 | Arbitrary CID strings were accepted. | Confirmed; accepted residual risk |

The initial contract allowed the six reported behaviors. Five were addressed through security improvements, while CID format validation remains an acknowledged limitation.

### 6.2 Findings That Were Not Vulnerabilities

The AI also examined reentrancy, unchecked external calls, and state ordering.

It did not identify a direct reentrancy vulnerability because AnchorRegistry does not transfer ETH or call untrusted external contracts in its reviewed functions.

Similarly, it did not identify unchecked external calls. The existing verification logic already checked whether records existed, prevented repeated verification, and required an independent verifier.

The AI also observed that historical records remain stored after role revocation. I treated this as expected behavior for an append-only record system rather than a confirmed vulnerability.

### 6.3 What the AI Missed

When I compared the AI findings with my manual review, I did not identify an additional confirmed vulnerability that the AI had completely missed.

However, the AI review did not prove that every possible security issue had been discovered. Its findings were based on source-code analysis rather than executing attacks.

The manual tests provided stronger evidence by showing which behaviors were actually possible and whether the updated contract prevented them.

### 6.4 What I Learned from the AI Audit

The AI helped identify authorization and input-validation weaknesses that deserved further investigation. However, I still needed to examine the contract, reproduce the reported behavior, and evaluate whether each finding was relevant to the application.

This exercise showed me that AI can support a security audit, but its output should not be treated as proof without independent verification.

## 7. Security Improvements

Before making changes, I preserved a copy of the original contract:

`contracts/AnchorRegistry.before-security-fixes.txt`

I then updated AnchorRegistry to address the confirmed authorization and input-validation issues.

The changes included protections against removing the final administrator, rejecting invalid role assignments, preventing empty CID submissions, and rejecting zero-valued record identifiers.

The updated contract also supported a safer process for transferring administrative responsibility.

After modifying the contract, I compiled it successfully with Solidity 0.8.24.

### Regression Testing

I ran the original AnchorRegistry test suite after the changes.

All 10 existing tests passed.

I also ran seven security regression tests. These covered administrator protection, invalid role assignments, empty CIDs, zero record identifiers, administrator handover, and valid record submission.

All seven regression tests passed.

The results confirmed that the tested security improvements worked while the previously tested application functionality remained available.

## 8. Deployment to DIDLab

Following local testing, I deployed the updated AnchorRegistry contract to the DIDLab blockchain.

**Original contract address:**

`0xce25f3fb25076c5f667813e6979c1a866bd39e0f`

**Updated contract address:**

`0xa0fffd4c2774b3497132059e1e4cf38594d7f289`
**Deployment transaction hash:**

`0x4058323d745d0a4c9b9e3501228ea30614178b9a5ad674cc0e1e0dc4a079581f`

**Deployment block:** 6909077

**Deployment status:** Success

The DIDLab block explorer confirmed that the updated AnchorRegistry contract was successfully deployed.
The deployment completed successfully, and the deploying account was confirmed to have the ADMIN role.

I also updated the frontend configuration to use the new contract address so that the application would interact with the revised implementation.

## 9. Live Application Verification

After deployment, I tested the application using the browser interface and connected wallet.

I submitted a new record identified as:

`BEEF-SECURITY-TEST-001`

The transaction was confirmed successfully on DIDLab.

I then used a separate authorized verifier account to verify the submitted record.

**Verification transaction hash:**

`0x579a3d02d40404f6e672570baa3f38c6e34a5da7560f7b65049cfeff5f3976a32`

**Block number:** 6910099

**Transaction status:** Success

After verification, I retrieved the record using the frontend's public lookup feature.

The returned information showed the verifier address, verification timestamp, and a verification status of `true`.

This confirmed that the updated contract supported both record submission and independent verification on the live DIDLab network.

## 10. Remaining Security Considerations

Although all 35 tests passed, some security risks remain.

**CID Validation:** AnchorRegistry still accepts arbitrary nonempty CID strings. I accepted this as a low-severity risk for the lab because full CID validation is not implemented. Future improvements could validate CID formats before submission.

**ADMIN Key Management:** The deploying account holds the ADMIN role and manages other users' permissions. The project uses Hardhat configuration variables for signing credentials. Private keys should be kept out of GitHub and accessible only to authorized users. If an ADMIN key is compromised, an attacker could grant or revoke permissions. A multisignature wallet would provide stronger protection in a production system.

**Off-Chain Data:** Blockchain records can help detect document changes, but they cannot guarantee that the original information is accurate or that IPFS files remain available.

These risks are documented because passing security tests does not guarantee that every possible vulnerability has been eliminated.

## 11. Personal Learning and Conclusion

This lab helped me understand smart contract security through practical examples rather than only studying the concepts.

The ownership attack showed how a missing permission check can allow unauthorized control. The reentrancy exercise demonstrated the importance of updating contract state before making external calls. The SafeVault tests showed how security protections can be introduced without preventing legitimate operations.

Reviewing AnchorRegistry was especially useful because it connected those concepts to an application I had already developed.

I learned how to reproduce unexpected contract behavior, evaluate AI-generated findings, implement corrections, and confirm changes using regression tests.

Finally, deploying the updated contract and successfully completing record submission and verification on DIDLab demonstrated that the tested application functionality remained operational after the security changes.

Overall, the lab strengthened my understanding of secure Solidity development and the importance of verifying security claims with actual evidence.