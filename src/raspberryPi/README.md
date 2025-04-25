# Raspberry Pi Item Tracking System

This system uses a Raspberry Pi to track items as they move through different locations. It scans QR codes containing transaction hashes, identifies the corresponding NFTs, and updates their location metadata on the blockchain.

## Hardware Requirements

- Raspberry Pi (with camera support)
- Pi Camera Module
- Button (connected to pin 10)
- Buzzer (connected to pin 11)
- RED LED (connected to pin 13)
- GREEN LED (connected to pin 15)
- Internet connection

## Software Setup

1. Install required Python packages:

   ```
   pip install opencv-python picamera2 web3 RPi.GPIO requests
   ```

2. Update the constants in `main.py` with your blockchain information:

   ```python
   BLOCKCHAIN_URL = "YOUR_BLOCKCHAIN_URL"
   PRIVATE_KEY = "YOUR_PRIVATE_KEY"
   CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"
   ```

3. Ensure you have your contract ABI in a file named `abi.json` in the same directory.

## How It Works

### Overview

This system tracks physical items that have QR codes attached to them. Each QR code contains a transaction hash from when the item was minted as an NFT. The system performs the following steps:

1. Scans the QR code to get the transaction hash
2. Retrieves the NFT token ID from the transaction hash
3. Determines the pool ID from the token ID
4. Scans all items in a pool
5. Updates the blockchain with the current location

### Location Tracking

The device is meant to be deployed at predetermined locations along a shipping route. For example:

1. Items are minted with initial location metadata (e.g., "Malaysia")
2. Items travel to several predetermined stops (e.g., Singapore, Egypt, Palestine)
3. At each stop, the device scans all items in the pool
4. The device updates the blockchain to reflect the items' current location

## Usage Instructions

1. Start the program by running:

   ```
   python main.py
   ```

2. Press the button to start scanning.

3. Scan the first item's QR code (contains transaction hash).

   - The RED LED will light up while processing the blockchain data
   - The system will determine how many items need to be scanned based on the pool size

4. Continue scanning each item when prompted.

   - GREEN LED indicates the system is ready to scan
   - RED LED indicates the system is processing a scan
   - The buzzer beeps to indicate successful scans

5. After all items are scanned, the system will:
   - Display the scanned items
   - Update the blockchain with the current location
   - Prepare for the next location

## LED and Sound Indicators

- **GREEN LED**: Ready to scan
- **RED LED**: Processing scan or blockchain transaction
- **Buzzer Beeps**:
  - 1 beep: Successful scan
  - 2 beeps: Start of scanning process
  - 3 beeps: All items scanned
  - 4 beeps: Successful blockchain update

## Example Workflow

1. Items are purchased in Malaysia and minted as NFTs with location "Malaysia"
2. Items arrive in Singapore:
   - The device at Singapore scans all items
   - Updates blockchain metadata to "Singapore"
3. Items continue to Egypt:
   - The device at Egypt scans all items
   - Updates blockchain metadata to "Egypt"
4. Items arrive at final destination (Palestine):
   - The device at Palestine scans all items
   - Updates blockchain metadata to "Palestine"
   - System marks the items as "ARRIVED"

## Troubleshooting

- If the system fails to read a QR code, try repositioning the item or improving lighting
- If blockchain updates fail, check your internet connection and verify account has enough gas
- To reset the scanning process, press the button again or press 'r' in the camera window
- To exit the application, press 'q' in the camera window
