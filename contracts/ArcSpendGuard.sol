// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BasePulse Arc SpendGuard
/// @notice A non-custodial policy boundary for owner-approved Arc USDC payments.
/// @dev The owner keeps custody and controls the ERC-20 allowance. Every payment
///      is explicitly submitted by the owner and emits a public audit event.
///      This contract does not provide unattended execution.
contract ArcSpendGuard {
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    address public owner;
    address public pendingOwner;
    uint256 public perPaymentLimit;
    uint256 public dailyLimit;
    uint256 public spendingDay;
    uint256 public spentToday;
    bool public paused;

    mapping(address => bool) public allowedRecipient;
    mapping(bytes32 => bool) public usedIntent;

    event PaymentExecuted(
        bytes32 indexed intentId,
        address indexed recipient,
        uint256 amount,
        uint256 indexed utcDay
    );
    event RecipientPermissionSet(address indexed recipient, bool allowed);
    event LimitsSet(uint256 perPaymentLimit, uint256 dailyLimit);
    event PauseSet(bool paused);
    event OwnershipTransferProposed(address indexed currentOwner, address indexed proposedOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotPendingOwner();
    error ZeroAddress();
    error InvalidLimits();
    error Paused();
    error EmptyIntent();
    error IntentAlreadyUsed();
    error InvalidAmount();
    error IntentExpired();
    error RecipientNotAllowed();
    error PerPaymentLimitExceeded();
    error DailyLimitExceeded();
    error USDCTransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 initialPerPaymentLimit, uint256 initialDailyLimit) {
        if (
            initialPerPaymentLimit == 0 ||
            initialDailyLimit == 0 ||
            initialPerPaymentLimit > initialDailyLimit
        ) revert InvalidLimits();

        owner = msg.sender;
        perPaymentLimit = initialPerPaymentLimit;
        dailyLimit = initialDailyLimit;
        spendingDay = currentUtcDay();
        emit LimitsSet(initialPerPaymentLimit, initialDailyLimit);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function currentUtcDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function remainingDailyCapacity() external view returns (uint256) {
        uint256 alreadySpent = spendingDay == currentUtcDay() ? spentToday : 0;
        return alreadySpent >= dailyLimit ? 0 : dailyLimit - alreadySpent;
    }

    function executePayment(
        bytes32 intentId,
        address recipient,
        uint256 amount,
        uint256 deadline
    ) external onlyOwner {
        if (paused) revert Paused();
        if (intentId == bytes32(0)) revert EmptyIntent();
        if (usedIntent[intentId]) revert IntentAlreadyUsed();
        if (recipient == address(0)) revert ZeroAddress();
        if (!allowedRecipient[recipient]) revert RecipientNotAllowed();
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert IntentExpired();
        if (amount > perPaymentLimit) revert PerPaymentLimitExceeded();

        uint256 utcDay = currentUtcDay();
        uint256 alreadySpent = spendingDay == utcDay ? spentToday : 0;
        if (alreadySpent >= dailyLimit || amount > dailyLimit - alreadySpent) {
            revert DailyLimitExceeded();
        }

        // Effects precede the external token call. A failed call reverts both writes.
        usedIntent[intentId] = true;
        spendingDay = utcDay;
        spentToday = alreadySpent + amount;

        (bool success, bytes memory result) = USDC.call(
            abi.encodeWithSelector(bytes4(0x23b872dd), owner, recipient, amount)
        );
        if (
            !success ||
            (result.length != 0 && (result.length != 32 || !abi.decode(result, (bool))))
        ) revert USDCTransferFailed();

        emit PaymentExecuted(intentId, recipient, amount, utcDay);
    }

    function setRecipientPermission(address recipient, bool allowed) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        allowedRecipient[recipient] = allowed;
        emit RecipientPermissionSet(recipient, allowed);
    }

    function setLimits(uint256 newPerPaymentLimit, uint256 newDailyLimit) external onlyOwner {
        if (
            newPerPaymentLimit == 0 ||
            newDailyLimit == 0 ||
            newPerPaymentLimit > newDailyLimit
        ) revert InvalidLimits();
        perPaymentLimit = newPerPaymentLimit;
        dailyLimit = newDailyLimit;
        emit LimitsSet(newPerPaymentLimit, newDailyLimit);
    }

    function setPaused(bool newPaused) external onlyOwner {
        paused = newPaused;
        emit PauseSet(newPaused);
    }

    function proposeOwner(address proposedOwner) external onlyOwner {
        if (proposedOwner == address(0)) revert ZeroAddress();
        pendingOwner = proposedOwner;
        emit OwnershipTransferProposed(msg.sender, proposedOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, msg.sender);
    }
}
