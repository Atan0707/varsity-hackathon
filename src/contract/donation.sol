// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DonationTracker is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct DonationPool {
        string name;
        uint256 totalDonated;
        uint256 totalWithdrawn;
        bool active;
        string[] checkpoints;
        uint256 currentCheckpointIndex;
        mapping(uint256 => bool) checkpointReleased;
    }

    struct Item {
        string name;
        string imageURI;
        uint256 poolId;
        string currentLocation;
        bool delivered;
    }

    mapping(uint256 => DonationPool) public donationPools;
    mapping(uint256 => Item) public items;
    mapping(uint256 => uint256[]) public poolToItems; // Maps pools to their items
    mapping(address => mapping(uint256 => uint256)) public donorContributions;

    uint256 public poolCount;
    address public companyWallet;

    // Events
    event PoolCreated(uint256 poolId, string name);
    event DonationReceived(address donor, uint256 poolId, uint256 amount);
    event ItemCreated(uint256 tokenId, string name, uint256 poolId);
    event LocationUpdated(uint256 poolId, string location);
    event FundsReleased(uint256 poolId, uint256 amount, string checkpoint);

    // First release 30%, final release 70%
    uint256 private constant FIRST_RELEASE_PERCENT = 30;
    uint256 private constant FINAL_RELEASE_PERCENT = 70;

    constructor(
        address initialOwner,
        address _companyWallet
    ) ERC721("DonationItems", "DONATE") Ownable(initialOwner) {
        companyWallet = _companyWallet;
    }

    // Create a new donation pool
    function createPool(
        string memory name,
        string[] memory checkpoints
    ) external onlyOwner {
        uint256 poolId = poolCount;

        DonationPool storage newPool = donationPools[poolId];
        newPool.name = name;
        newPool.active = true;

        for (uint i = 0; i < checkpoints.length; i++) {
            newPool.checkpoints.push(checkpoints[i]);
        }

        emit PoolCreated(poolId, name);
        poolCount++;
    }

    // Donate to a pool
    function donate(uint256 poolId) external payable nonReentrant {
        require(poolId < poolCount, "Pool does not exist");
        require(donationPools[poolId].active, "Pool is not active");
        require(msg.value > 0, "Must donate something");

        donationPools[poolId].totalDonated += msg.value;
        donorContributions[msg.sender][poolId] += msg.value;

        emit DonationReceived(msg.sender, poolId, msg.value);
    }

    // Company creates items with NFTs for tracking
    function createItem(
        string memory name,
        string memory imageURI,
        uint256 poolId,
        string memory initialLocation
    ) external onlyOwner returns (uint256) {
        require(poolId < poolCount, "Pool does not exist");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);

        // Set the item data
        items[newItemId] = Item({
            name: name,
            imageURI: imageURI,
            poolId: poolId,
            currentLocation: initialLocation,
            delivered: false
        });

        // Add this item to the pool's items
        poolToItems[poolId].push(newItemId);

        emit ItemCreated(newItemId, name, poolId);

        return newItemId;
    }

    // Update location for all items in a pool
    function updatePoolItemsLocation(
        uint256 poolId,
        string memory newLocation
    ) external onlyOwner {
        require(poolId < poolCount, "Pool does not exist");

        DonationPool storage pool = donationPools[poolId];

        // Find the checkpoint index
        uint256 checkpointIndex = type(uint256).max;
        for (uint i = 0; i < pool.checkpoints.length; i++) {
            if (
                keccak256(bytes(pool.checkpoints[i])) ==
                keccak256(bytes(newLocation))
            ) {
                checkpointIndex = i;
                break;
            }
        }

        require(
            checkpointIndex != type(uint256).max,
            "Location is not a valid checkpoint"
        );

        // Update location for all items in the pool
        uint256[] memory itemsInPool = poolToItems[poolId];
        for (uint i = 0; i < itemsInPool.length; i++) {
            items[itemsInPool[i]].currentLocation = newLocation;

            // If it's the final checkpoint, mark as delivered
            if (checkpointIndex == pool.checkpoints.length - 1) {
                items[itemsInPool[i]].delivered = true;
            }
        }

        // If this is a new checkpoint (moving forward), release funds
        if (
            checkpointIndex > pool.currentCheckpointIndex &&
            !pool.checkpointReleased[checkpointIndex]
        ) {
            pool.currentCheckpointIndex = checkpointIndex;
            pool.checkpointReleased[checkpointIndex] = true;

            uint256 amountToRelease;

            if (checkpointIndex == 0) {
                // First checkpoint - release 30%
                amountToRelease =
                    (pool.totalDonated * FIRST_RELEASE_PERCENT) /
                    100;
            } else if (checkpointIndex == pool.checkpoints.length - 1) {
                // Final checkpoint - release remaining 70%
                amountToRelease =
                    (pool.totalDonated * FINAL_RELEASE_PERCENT) /
                    100;
            }

            if (amountToRelease > 0) {
                pool.totalWithdrawn += amountToRelease;

                // Transfer the funds to the company wallet
                (bool success, ) = companyWallet.call{value: amountToRelease}(
                    ""
                );
                require(success, "Transfer failed");

                emit FundsReleased(poolId, amountToRelease, newLocation);
            }
        }

        emit LocationUpdated(poolId, newLocation);
    }

    // Get items for a pool
    function getPoolItems(
        uint256 poolId
    ) external view returns (uint256[] memory) {
        return poolToItems[poolId];
    }

    // Get item details
    function getItemDetails(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory name,
            string memory imageURI,
            uint256 poolId,
            string memory currentLocation,
            bool delivered
        )
    {
        Item memory item = items[tokenId];
        return (
            item.name,
            item.imageURI,
            item.poolId,
            item.currentLocation,
            item.delivered
        );
    }

    // Update company wallet
    function setCompanyWallet(address newWallet) external onlyOwner {
        companyWallet = newWallet;
    }

    // Deactivate a pool (no more donations)
    function deactivatePool(uint256 poolId) external onlyOwner {
        require(poolId < poolCount, "Pool does not exist");
        donationPools[poolId].active = false;
    }

    // Activate a pool
    function activatePool(uint256 poolId) external onlyOwner {
        require(poolId < poolCount, "Pool does not exist");
        donationPools[poolId].active = true;
    }

    // Get all items with details for a pool
    function getPoolItemsWithDetails(
        uint256 poolId
    )
        external
        view
        returns (
            uint256[] memory ids,
            string[] memory names,
            string[] memory imageURIs,
            string[] memory locations,
            bool[] memory deliveryStatuses
        )
    {
        uint256[] memory itemIds = poolToItems[poolId];
        uint256 itemCount = itemIds.length;

        names = new string[](itemCount);
        imageURIs = new string[](itemCount);
        locations = new string[](itemCount);
        deliveryStatuses = new bool[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            Item memory item = items[itemIds[i]];
            names[i] = item.name;
            imageURIs[i] = item.imageURI;
            locations[i] = item.currentLocation;
            deliveryStatuses[i] = item.delivered;
        }

        return (itemIds, names, imageURIs, locations, deliveryStatuses);
    }
}
