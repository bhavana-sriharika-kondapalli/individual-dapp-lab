
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

## Conclusion
The project separates encrypted off-chain documents from publicly verifiable on-chain evidence. The design supports integrity checking and independent verification while reducing plaintext exposure. However, public blockchain metadata still creates privacy risks, and encryption key management remains essential.
