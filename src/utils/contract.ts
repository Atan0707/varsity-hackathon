import { ethers, Eip1193Provider, Contract, Wallet } from 'ethers';
import contractABI from '@/contract/abi.json';
import { Pool } from './poolData';
import { CONTRACT_ADDRESS } from './config';


export const getContract = async (walletProvider: unknown): Promise<Contract> => {
  try {
    // If walletProvider is already a Wallet (from private key), use it directly
    if (walletProvider instanceof Wallet) {
      return new ethers.Contract(CONTRACT_ADDRESS, contractABI, walletProvider);
    }
    
    // Otherwise, assume it's an EIP-1193 provider
    const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const getReadOnlyContract = (): Contract => {
  try {
    // For read-only operations, use a provider instead of a signer
    const provider = new ethers.JsonRpcProvider('https://scroll-sepolia.g.alchemy.com/v2/7z_rnkKFONf8r6Adr1poXg1qugZlhclq'); // Example RPC URL (Sepolia testnet)
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
  } catch (error) {
    console.error('Error getting read-only contract:', error);
    throw error;
  }
};

export const getAllPoolsFromChain = async (): Promise<Pool[]> => {
  try {
    const contract = getReadOnlyContract();
    const [ids, names, descriptions, imageURIs, targetAmounts, endDates, activeStatus, totalDonated] = await contract.getAllPools();
    
    // Current timestamp in seconds
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Create pool objects from blockchain data
    const pools = ids.map((id: bigint, index: number) => {
      const poolId = Number(id);
      const totalAmount = Number(totalDonated[index]);
      const targetAmount = Number(targetAmounts[index]);
      const endDateTimestamp = Number(endDates[index]);
      
      // Calculate days left
      const secondsLeft = Math.max(0, endDateTimestamp - currentTimestamp);
      const daysLeft = Math.ceil(secondsLeft / (60 * 60 * 24));
      
      // Calculate percentage raised
      const percentageRaised = targetAmount > 0 
        ? Math.min(Math.floor((totalAmount / targetAmount) * 100), 100) 
        : 0;
      
      // Convert amounts from wei to ETH for display
      const totalAmountEth = totalAmount / 1e18;
      const targetAmountEth = targetAmount / 1e18;
      
      return {
        id: poolId.toString(),
        title: names[index],
        tagline: `${names[index]} Crowdfunding Pool`,
        categories: ['CROWDFUNDING'],
        badges: activeStatus[index] ? ['ACTIVE'] : ['INACTIVE'],
        videoUrl: '', // Will be fetched in detail view
        status: activeStatus[index] ? 'Live' : 'Closed',
        currentAmount: totalAmountEth,
        targetAmount: targetAmountEth,
        percentageRaised: percentageRaised,
        donors: 0, // Will be fetched in detail view
        largestInvestment: 0, // Will be fetched in detail view
        daysLeft: daysLeft,
        logoUrl: imageURIs[index] || '/logos/habibi.jpg', // Use blockchain URI
        description: descriptions[index],
      };
    });
    
    return pools;
  } catch (error) {
    console.error('Error getting pools from chain:', error);
    return [];
  }
};

export const getPoolLogoURI = async (poolId: number): Promise<string | undefined> => {
  try {
    const contract = getReadOnlyContract();
    // Get pool details
    const [, , imageURI] = await contract.getPoolDetails(poolId);
    return imageURI;
  } catch (error) {
    console.error('Error getting pool logo URI:', error);
    return undefined;
  }
};

export const getPoolByIdFromChain = async (id: string, walletProvider?: unknown): Promise<Pool | undefined> => {
  try {
    const contract = walletProvider ? 
      await getContract(walletProvider) : 
      getReadOnlyContract();
    
    const poolId = Number(id);
    
    // Get pool details from the contract
    const [
      name,
      description,
      imageURI,
      videoLink,
      targetAmount,
      endDate,
      totalDonated,
      ,  // Skip totalWithdrawn
      active,
      checkpoints,
      currentCheckpointIndex,
      checkpointReleaseStatus
    ] = await contract.getPoolDetails(poolId);
    
    // Get pool items to count donors
    const itemTokens = await contract.getPoolItems(poolId);
    const donorCount = itemTokens.length;
    
    // Convert values from BigInt to Number for calculations
    const targetAmountNum = Number(targetAmount);
    const totalDonatedNum = Number(totalDonated);
    const endDateNum = Number(endDate);
    
    // Convert values from wei to ether
    const donatedAmount = totalDonatedNum / 1e18;
    const targetAmountEth = targetAmountNum / 1e18;
    
    // Calculate percentage raised
    const percentageRaised = targetAmountNum > 0 
      ? Math.min(Math.floor((totalDonatedNum / targetAmountNum) * 100), 100) 
      : 0;
    
    // Calculate days left
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const secondsLeft = Math.max(0, endDateNum - currentTimestamp);
    const daysLeft = Math.ceil(secondsLeft / (60 * 60 * 24));
    
    return {
      id: id,
      title: name,
      tagline: `${name} Crowdfunding Pool`,
      categories: ['CROWDFUNDING'],
      badges: active ? ['ACTIVE'] : ['INACTIVE'],
      videoUrl: videoLink,
      status: active ? 'Live' : 'Closed',
      currentAmount: donatedAmount,
      targetAmount: targetAmountEth,
      percentageRaised: percentageRaised,
      donors: donorCount,
      largestInvestment: donatedAmount * 0.3, // Just an example, could be calculated from events
      daysLeft: daysLeft,
      logoUrl: imageURI || '/logos/habibi.jpg',
      description: description,
      checkpoints, 
      currentCheckpointIndex: Number(currentCheckpointIndex),
      checkpointReleaseStatus
    };
  } catch (error) {
    console.error('Error getting pool by ID from chain:', error);
    return undefined;
  }
};

export const donateToPool = async (poolId: number, amount: string, walletProvider: unknown): Promise<boolean> => {
  try {
    const contract = await getContract(walletProvider);
    
    // Convert amount from ether to wei
    const amountInWei = ethers.parseEther(amount);
    
    // Call the donate function with the specified amount
    const tx = await contract.donate(poolId, { value: amountInWei });
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error('Error donating to pool:', error);
    return false;
  }
};

export interface Donator {
  address: string;
  amount: number;
  timestamp: number;
}

export const getPoolDonators = async (poolId: string): Promise<Donator[]> => {
  try {
    const contract = getReadOnlyContract();
    const provider = contract.runner as ethers.JsonRpcProvider;
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Define chunk size (to stay within RPC limitations)
    const CHUNK_SIZE = 5000;
    
    // Calculate a reasonable starting block (e.g., 30 days ago)
    // Using ~13s per block, 30 days = ~200,000 blocks
    let startBlock = Math.max(currentBlock - 200000, 0);
    
    const allEvents = [];
    
    // Fetch events in chunks
    while (startBlock <= currentBlock) {
      const endBlock = Math.min(startBlock + CHUNK_SIZE, currentBlock);
      
      try {
        console.log(`Fetching events from block ${startBlock} to ${endBlock}`);
        const filter = contract.filters.DonationReceived();
        const events = await contract.queryFilter(filter, startBlock, endBlock);
        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching chunk from ${startBlock} to ${endBlock}:`, error);
      }
      
      // Move to next chunk
      startBlock = endBlock + 1;
    }
    
    // Process and filter events for the specific pool
    const donatorMap = new Map<string, Donator>(); // Use Map to deduplicate by address
    
    for (const event of allEvents) {
      // Type assertion for ethers event
      const { args } = event as unknown as { args: [string, bigint, bigint] };
      const [donor, eventPoolId, amount] = args || [];
      
      // Skip if not matching the requested pool
      if (Number(eventPoolId) !== Number(poolId)) {
        continue;
      }
      
      // Get block timestamp for the event
      const block = await event.getBlock();
      const timestamp = block.timestamp * 1000; // Convert to JS timestamp (ms)
      const amountInEther = Number(amount) / 1e18;
      
      // If donor exists in map, add to their amount and update timestamp if more recent
      if (donatorMap.has(donor)) {
        const existing = donatorMap.get(donor)!;
        // Sum the amounts
        existing.amount += amountInEther;
        // Update timestamp if this event is more recent
        if (timestamp > existing.timestamp) {
          existing.timestamp = timestamp;
        }
      } else {
        // New donor
        donatorMap.set(donor, {
          address: donor,
          amount: amountInEther,
          timestamp: timestamp
        });
      }
    }
    
    // Convert Map to array and sort by timestamp (newest first)
    return Array.from(donatorMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting pool donators:', error);
    return [];
  }
};

export interface ItemDetails {
  name: string;
  imageURI: string;
  poolId: number;
  currentLocation: string;
  delivered: boolean;
  lastUpdated: number;
}

export const getItemDetails = async (tokenId: string): Promise<ItemDetails | null> => {
  try {
    const contract = getReadOnlyContract();
    
    try {
      // Call the getItemDetails function from the smart contract
      const [name, imageURI, poolId, currentLocation, delivered, lastUpdated] = 
        await contract.getItemDetails(tokenId);
      
      // Check if we got empty data (non-existent token)
      if (!name && !imageURI && Number(poolId) === 0) {
        console.log('Item does not exist');
        return null;
      }
      
      return {
        name,
        imageURI,
        poolId: Number(poolId),
        currentLocation,
        delivered,
        lastUpdated: Number(lastUpdated) * 1000 // Convert from seconds to milliseconds
      };
    } catch (contractError) {
      // This is likely a revert from the contract - token doesn't exist
      console.error('Contract error getting item details:', contractError);
      return null;
    }
  } catch (error) {
    console.error('Error getting item details:', error);
    return null;
  }
}; 