// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BasePulse Arc Treasury Proof
/// @notice A minimal, non-custodial audit-anchor registry for Arc.
/// @dev Does not hold, approve, or transfer USDC. Only the deployer can anchor hashes.
contract ArcTreasuryProof {
    address public owner;
    uint256 public proofCount;
    mapping(bytes32 => bool) public recorded;

    event TreasuryProofRecorded(bytes32 indexed proofHash, address indexed author, uint256 indexed sequence);
    
    error NotOwner();
    error EmptyProof();
    error DuplicateProof();

    constructor() {
        owner = msg.sender;
    }

    /// @param proofHash Hash of a public transaction receipt, reconciliation report, or audit record.
    /// @dev The underlying report stays offchain; never anchor secrets or private data.
    function recordProof(bytes32 proofHash) external {
        if (msg.sender != owner) revert NotOwner();
        if (proofHash == bytes32(0)) revert EmptyProof();
        if (recorded[proofHash]) revert DuplicateProof();
        recorded[proofHash] = true;
        unchecked { ++proofCount; }
        emit TreasuryProofRecorded(proofHash, msg.sender, proofCount);
    }
}
