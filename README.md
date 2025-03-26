# GlassFund

GlassFund is a transparent charity funding platform built on the Scroll network that allows donors to track their donations through NFTs with NFC tags.

## Live Demo

[https://glassfund.vercel.app/](https://glassfund.vercel.app/)

## Overview

GlassFund introduces a new model for charity donations where:

1. **Donors** can:

   - Choose specific donation pools (e.g., Aman Palestine)
   - Pay using crypto or fiat (RM)
   - Track their donations via smart contracts
   - The funds will be staged release to the company (30% at first stop, 70% after all NFT checkpoints)

2. **Our Platform**:
   - Purchases goods with pooled donations
   - Creates NFTs representing these goods
   - Embeds NFC stickers and QR codes on physical items
   - Ships items to locations in need (e.g., Palestine)
   - Updates location data across defined checkpoints
   - Staff scan NFC stickers to update the location of items
   - Donors can track their donations in real-time

## DAO Governance

GlassFund incorporates DAO functionality that allows stakeholders to:

- Create proposals for new donation pools or charity initiatives
- Vote on existing proposals
- Track proposal status and execution
- Participate in community governance decisions

## Front-End View

### GlassFund Landing Page
![image](https://github.com/user-attachments/assets/2088bee5-6dfa-4eb6-b085-cd831de4bb2b)


### GlassFund DAO
![image](https://github.com/user-attachments/assets/c2bb7975-d23b-432c-97aa-d125ec1bc1eb)

### Current crowdfund pool - Everything is on-chain
![image](https://github.com/user-attachments/assets/02793147-1995-4a64-bb18-f39e863f03e4)


### Crowdfund pool page - Users can donate their money here
![image](https://github.com/user-attachments/assets/ed3a9d80-275f-46b3-b11c-efdfb4b6b3ac)


### User can view the crowdfund progress
![image](https://github.com/user-attachments/assets/4a8477f4-2342-4c32-98cb-4adcf5d0db37)


### All donators will be listed here
![image](https://github.com/user-attachments/assets/961e4362-8f59-4622-8bee-5a36f38c0311)



## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Blockchain**: Deployed on Scroll Network (Ethereum L2)
- **Smart Contracts**: Solidity (ERC-721 for NFTs, DAO contract for governance)
- **Web3 Integration**: ethers.js and Reown AppKit
- **UI**: TailwindCSS and Framer Motion
- **Authentication**: Wallet-based authentication
- **Physical Integration**: NFC tags + QR codes for item tracking

## Project Architecture

![image](https://github.com/user-attachments/assets/f6fa8a08-fe1d-4a04-8cfd-47b39d2dc4b0)

- Donated money will be locked into smart contract
- Item purchased for the crowdfund will be converted into NFT for tracking
- Item location will be updated and stored into NFT metadata.
- Once item have been delivered to the assigned destination, the fund will be released from smart contract.

## Getting Started

### Prerequisites

- Node.js (16+)
- Yarn package manager
- MetaMask or compatible wallet with Scroll Network configured

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/glassfund.git
cd glassfund
```

2. Install dependencies:

```bash
yarn
```

3. Run the development server:

```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Using the Platform

### For Donors

1. **Connect Your Wallet**: Click on the "Connect Wallet" button and authorize your MetaMask or other compatible wallet. Make sure your wallet is configured to use the Scroll Network.

2. **Choose a Donation Pool**: Browse available donation pools and select one that aligns with your interests.

3. **Make a Donation**: Choose between crypto or fiat payment options and complete your transaction.

4. **Receive NFT Receipt**: After donation, you'll receive an NFT receipt representing your contribution.

5. **Track Your Impact**: Use the dashboard to track the journey of your donation through all checkpoints.

### For Governance Participants

1. **Access DAO Portal**: Navigate to the DAO section of the platform.

2. **View Proposals**: Browse existing proposals and their current status.

3. **Create Proposals**: Submit new proposals for community consideration.

4. **Cast Votes**: Participate in governance by voting on active proposals.

5. **Monitor Execution**: Track the implementation of successful proposals.

## Checkpoints System

Our unique 4-checkpoint system ensures complete transparency:

1. **First Stop (Singapore)**: Initial processing and preparation
2. **Transit Point 1**: International shipping milestone
3. **Transit Point 2**: Regional distribution center
4. **Final Destination**: Delivery to those in need

At each checkpoint, our staff scan the NFC tags embedded in the donated goods, updating the blockchain record and allowing donors to track their contributions in real-time.

## Contract Addresses (Scroll Network)

- Donation Contract: [`0x41851a430DB01124Ff7379cB5a890c9bd4785e04`](https://sepolia.scrollscan.com/address/0x41851a430db01124ff7379cb5a890c9bd4785e04)

## Future Implementation

- Add governance token for donators, which allows them to participate in DAO
- QR Code with NFC for tracking system
