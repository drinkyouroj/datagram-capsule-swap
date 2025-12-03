// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract CapsuleSwap {
    address public owner;
    address public signer;
    address public treasury;
    IERC721 public capsuleContract;
    
    uint256 public payoutPercentage = 25; // 25%
    bool public maintenanceMode = false;

    mapping(uint256 => bool) public usedNonces;
    mapping(uint256 => bool) public processedCapsules; // Track paid tokenIds

    event Swapped(address indexed user, uint256 indexed tokenId, uint256 amount);
    event TreasuryUpdated(address newTreasury);
    event SignerUpdated(address newSigner);
    event PercentageUpdated(uint256 newPercentage);

    constructor(address _capsuleContract, address _signer, address _treasury) {
        owner = msg.sender;
        capsuleContract = IERC721(_capsuleContract);
        signer = _signer;
        treasury = _treasury;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notMaintenance() {
        require(!maintenanceMode, "Maintenance mode");
        _;
    }

    function swap(
        uint256 tokenId,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external notMaintenance {
        require(block.timestamp <= deadline, "Expired");
        require(!usedNonces[nonce], "Nonce used");
        require(!processedCapsules[tokenId], "Capsule already processed");
        
        // Verify Signature
        bytes32 message = keccak256(abi.encodePacked(tokenId, amount, msg.sender, nonce, deadline, address(this)));
        bytes32 ethSignedMessage = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        address recoveredSigner = recoverSigner(ethSignedMessage, signature);
        require(recoveredSigner == signer, "Invalid signature");

        usedNonces[nonce] = true;
        processedCapsules[tokenId] = true;

        // Transfer Capsule to Treasury
        capsuleContract.transferFrom(msg.sender, treasury, tokenId);

        // Transfer DGRAM to User
        _payout(msg.sender, amount, tokenId);
    }

    // New function for the Listener Bot
    function payoutDirect(address recipient, uint256 amount, uint256 tokenId) external onlyOwner notMaintenance {
        require(!processedCapsules[tokenId], "Capsule already processed");
        processedCapsules[tokenId] = true;
        _payout(recipient, amount, tokenId);
    }

    function _payout(address recipient, uint256 amount, uint256 tokenId) internal {
        require(address(this).balance >= amount, "Insufficient liquidity");
        (bool sent, ) = payable(recipient).call{value: amount}("");
        require(sent, "Failed to send DGRAM");
        emit Swapped(recipient, tokenId, amount);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // Admin Functions
    function setMaintenance(bool _maintenance) external onlyOwner {
        maintenanceMode = _maintenance;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function setPercentage(uint256 _percentage) external onlyOwner {
        payoutPercentage = _percentage;
        emit PercentageUpdated(_percentage);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
