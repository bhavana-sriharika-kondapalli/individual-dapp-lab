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

The next exercise investigated a withdrawal function that transferred funds before updating the sender's recorded balance.

This ordering is dangerous because the receiving contract may execute additional code before the original withdrawal finishes.

I tested this behavior using the Reenterer contract. The attempted reentrant withdrawal reverted because Solidity's arithmetic checks prevented the repeated balance deductions from completing.

Although the attempted exploit did not successfully drain funds, the exercise demonstrated why contract state should be updated before interacting with an external address.

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

| Finding | Observation | Verification outcome |
|---|---|---|
| AC-01 | The last administrator could revoke their own ADMIN permission. | Reproduced and addressed |
| AC-02 | Unsupported role identifiers were accepted. | Reproduced and addressed |
| AC-03 | Administrative role assignments accepted the zero address. | Reproduced and addressed |
| IV-01 | An empty IPFS CID could be submitted. | Reproduced and addressed |
| IV-02 | A zero-valued record identifier could be submitted. | Reproduced and addressed |
| IV-03 | Arbitrary CID strings were accepted. | Reproduced; complete format-validation status requires confirmation |

The original behavior was examined through adversarial tests, and the targeted fixes were checked using additional regression tests.

## 6. AI-Assisted Review

I also used an AI-assisted audit to examine the contract for possible security problems.

Instead of treating every AI-generated observation as correct, I compared the findings with the Solidity source and created tests to investigate the reported behavior.

The original AI review was preserved in:

`docs/AI_AUDIT_RAW.md`

My verification work was recorded in:

`docs/AI_AUDIT_VERIFICATION.md`

Six tests were completed successfully during this verification stage.

The exercise showed that AI can help identify areas worth investigating, but its findings still need independent confirmation. A reported issue should be supported by contract behavior, a reproducible test, or a clear explanation based on the source code.

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

The completed tests covered several important security scenarios, but they do not guarantee that every possible vulnerability has been eliminated.

Administrative accounts remain sensitive because anyone who gains control of an administrator's private key could potentially exercise that account's permissions.

The application also depends on off-chain content. A blockchain digest can help detect changes to referenced data, but it cannot independently establish that the original document was truthful.

Additionally, CID validation and the availability of off-chain content require careful consideration. Even a correctly formatted CID does not guarantee that the referenced content remains accessible.

Future development should include additional testing, review of deployment permissions, and checks to ensure that the frontend continues using the correct contract address and interface.

## 11. Personal Learning and Conclusion

This lab helped me understand smart contract security through practical examples rather than only studying the concepts.

The ownership attack showed how a missing permission check can allow unauthorized control. The reentrancy exercise demonstrated the importance of updating contract state before making external calls. The SafeVault tests showed how security protections can be introduced without preventing legitimate operations.

Reviewing AnchorRegistry was especially useful because it connected those concepts to an application I had already developed.

I learned how to reproduce unexpected contract behavior, evaluate AI-generated findings, implement corrections, and confirm changes using regression tests.

Finally, deploying the updated contract and successfully completing record submission and verification on DIDLab demonstrated that the tested application functionality remained operational after the security changes.

Overall, the lab strengthened my understanding of secure Solidity development and the importance of verifying security claims with actual evidence.