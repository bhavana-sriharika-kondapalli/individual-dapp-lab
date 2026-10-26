
# Activity 12 — Privacy Audit

## Project
Chuck and Verify — Beef Supply Chain Verification

## Network and Contract
- Network: DIDLab Blockchain
- Chain ID: 252501
- Contract: AnchorRegistry
- Contract address: 0xce25f3fb25076c5f667813e6979c1a866bd39e0f

## Record Audited
- Record ID: BEEF-001
- Encrypted IPFS CID: QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB
- Ciphertext SHA-256: 6136e792f2e5387b20f9a76542c95b635a32dbed894aafc33312f1ef944597c8

## Information Visible On-Chain
The AnchorRegistry contract exposes:
- Record identifier hash
- SHA-256 digest of the encrypted file
- IPFS CID referencing the encrypted file
- Submitter wallet address
- Submission timestamp
- Verifier wallet address
- Verification timestamp
- Transaction metadata and contract events

These fields can be inspected by blockchain participants and should not be considered private.

## Information Stored Off-Chain
The original beef inspection report is stored as an AES-256-GCM encrypted payload on IPFS.

The plaintext report is not intentionally published on-chain. The recovery information is kept separately from the public contract.

## Privacy Risks
1. Wallet addresses can reveal relationships between supply-chain participants.
2. Timestamps can reveal when inspections or verification activities occur.
3. Public CIDs allow observers to retrieve the encrypted ciphertext.
4. Record identifiers and events may reveal business activity.
5. If encryption keys or recovery credentials are exposed, confidentiality may be lost.

## Privacy Controls
- Encrypt files before uploading them to IPFS.
- Store only ciphertext digests and CIDs on-chain.
- Keep encryption secrets and recovery materials secure.
- Avoid putting customer, employee, or confidential inspection details directly on-chain.
- Use separate submitter and verifier roles.
- Enforce permissions inside the smart contract, not only in the frontend.

## Security Evidence
- Unauthorized anchoring simulation: rejected.
- Unauthorized verification simulation: rejected.
- Submitter self-verification simulation: rejected, although the record was already verified, so this specific result does not independently prove the self-verification rule.
- Independent verification by a separate authorized wallet: successful.
- Frontend role-panel visibility bypass: demonstrated.
- Smart contract authorization remains independent of frontend visibility.

## Field-by-Field Privacy Audit

| Field | Where It Appears | Could Identify a Person? | Verdict |
|---|---|---|---|
| recordId | Calldata, mapping key, event topic | Low risk for BEEF-001, a business batch identifier; predictable identifiers can still reveal activity | Acceptable for non-personal batch IDs |
| digest | Calldata, contract state, event topic | Not directly; it hashes encrypted ciphertext | Acceptable |
| cid | Calldata, contract state, event data | Not directly, but links to retrievable encrypted content | Acceptable with encryption |
| submitter / msg.sender | Contract state, transactions, event topics | Yes, wallet activity may be linked to a person or organization | Pseudonymous; monitor metadata exposure |
| submittedAt | Contract state, block timestamp | Indirectly, when combined with wallet activity | Acceptable with metadata risk |
| verifier | Contract state, event topic | Yes, may identify an inspector or organization | Pseudonymous; monitor metadata exposure |
| verifiedAt | Contract state, event data | Indirectly, through timing and wallet correlation | Acceptable with metadata risk |
| Role identifiers (ADMIN, SUBMITTER, VERIFIER) | Contract state, role-management calldata and events | Not individually, but reveal authorization structure | Acceptable |
| Role account addresses | Contract state, role-management calldata and events | Yes, addresses can be linked to participants | Acceptable with pseudonymity limitations |
| Role-granting administrator address | Transactions and role-management events | Yes, identifies the wallet controlling role assignments | Acceptable with administrative security controls |

## Record Identifier Derivation

The record ID is generated using keccak256 of the business batch identifier BEEF-001.

This identifier represents a beef supply-chain batch rather than a person's name, student ID, or personal record. It is suitable for this demonstration, although predictable business identifiers can be guessed and correlated with public transactions.

## Overall Privacy Verdict

No plaintext inspection document is intentionally written to blockchain storage, calldata, or events. The encrypted ciphertext is stored off-chain through IPFS.

The design is acceptable for this lab, with residual risks from public wallet addresses, timestamps, role assignments, predictable batch identifiers, and possible future exposure of encryption keys.

## Conclusion
The project separates encrypted off-chain documents from publicly verifiable on-chain evidence. The design supports integrity checking and independent verification while reducing plaintext exposure. However, public blockchain metadata still creates privacy risks, and encryption key management remains essential.
