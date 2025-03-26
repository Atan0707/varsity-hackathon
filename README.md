# GlassFund

GlassFund is a transparent charity funding platform built on the Scroll network that allows donors to track their donations through NFTs with NFC tags.

## Live Demo

[https://glassfund.vercel.app/](https://glassfund.vercel.app/)

## Overview

GlassFund introduces a new model for charity donations where:

1. **Donors** can:

   - Choose specific donation pools (e.g., RM10 pools)
   - Join ETH pools (collected monthly, RM50k per month)
   - Pay using crypto or fiat (RM)
   - Track their donations via smart contracts
   - Receive funds in a staged release (30% at first stop, 70% after all NFT checkpoints)

2. **Our Platform**:
   - Purchases goods with pooled donations
   - Creates NFTs representing these goods
   - Embeds NFC tags and QR codes on physical items
   - Ships items to locations in need (e.g., Palestine)
   - Updates location data across 4 checkpoints
   - Staff scan NFC tags to update the location of items
   - Donors can track their donations in real-time

## DAO Governance

GlassFund incorporates DAO functionality that allows stakeholders to:

- Create proposals for new donation pools or charity initiatives
- Vote on existing proposals
- Track proposal status and execution
- Participate in community governance decisions

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Blockchain**: Deployed on Scroll Network (Ethereum L2)
- **Smart Contracts**: Solidity (ERC-721 for NFTs, DAO contract for governance)
- **Web3 Integration**: ethers.js and Reown AppKit
- **UI**: TailwindCSS and Framer Motion
- **Authentication**: Wallet-based authentication
- **Physical Integration**: NFC tags + QR codes for item tracking

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

- Donation Contract: `0x41851a430DB01124Ff7379cB5a890c9bd4785e04`
- DAO Contract: `0x41851a430DB01124Ff7379cB5a890c9bd4785e04`
- NFT Contract: `0x41851a430DB01124Ff7379cB5a890c9bd4785e04`
