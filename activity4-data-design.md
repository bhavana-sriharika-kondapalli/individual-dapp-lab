
# Lab 2 — Activity 4: On-Chain vs. Off-Chain Data Design

## Project: Chuck and Verify — Beef Supply Chain

### Objective
To identify which information should be stored on the DIDLab blockchain and which information should remain off-chain in encrypted IPFS storage.

### Data Storage Design

| Data | Storage | Reason |
|---|---|---|
| Beef inspection report PDF | Off-chain | Protects document contents and avoids expensive blockchain storage |
| Encrypted file SHA-256 digest | On-chain | Enables integrity verification |
| IPFS CID | On-chain | Identifies the encrypted document |
| Batch record ID | On-chain | Uniquely identifies the record |
| Submitter wallet address | On-chain | Provides accountability |
| Blockchain timestamp | On-chain | Records when the document was anchored |
| Verification status | On-chain | Shows authorized verification |
| Verifier wallet address | On-chain | Identifies the verifier |
| Original filename | Off-chain | Avoids exposing unnecessary metadata |
| Inspector personal information | Off-chain | Protects privacy |
| Inspection observations | Off-chain | Keeps detailed information private |
| Recovery JSON | Private local storage | Supports future decryption and recovery |

### Project Example

The Chuck and Verify project uses the beef batch BEEF-001.

The batch inspection PDF was encrypted using AES-256-GCM and uploaded to DIDLab Secure IPFS.

CID:
QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB

Ciphertext SHA-256:
6136e792f2e5387b20f9a76542c95b635a32dbed894aafc33312f1ef944597c8

The CID and digest will be anchored on the blockchain in a later activity.

### Why Off-Chain Storage?

Storing entire documents on a blockchain is expensive and makes their contents publicly accessible.

Encrypted IPFS storage protects the document contents while allowing the blockchain to maintain a permanent reference.

### Why On-Chain Anchoring?

The blockchain records the ciphertext digest, CID, submitter, and timestamp.

A verifier can retrieve the encrypted file, calculate its SHA-256 digest, and compare it with the recorded digest to detect changes.

### Privacy Considerations

Personal information, private inspection details, and encryption recovery information should not be published on-chain.

Wallet addresses and timestamps are publicly visible, so the design should minimize unnecessary information.

### Conclusion

Chuck and Verify uses encrypted IPFS for document storage and DIDLab blockchain records for integrity, traceability, and authorization.

This approach combines off-chain privacy with on-chain verification.
