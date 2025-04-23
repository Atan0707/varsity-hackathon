/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider } from "ethers";
import { ethers } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { CONTRACT_ADDRESS } from "@/utils/config";
import ABI from "../../../contract/abi.json";
import { useParams, useRouter } from "next/navigation";

interface ScannedItem {
    tokenId: string;
    txHash: string;
    details?: {
        name: string;
        currentLocation: string;
    };
}

interface PoolDetails {
    name: string;
    checkpoints: string[];
    currentCheckpointIndex: number;
}

export default function ScanItemsPage() {
    const router = useRouter();
    const params = useParams();
    const poolId = params.id as string;
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [totalPoolItems, setTotalPoolItems] = useState<number>(0);
    const [location, setLocation] = useState("");
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [readStatus, setReadStatus] = useState<'idle' | 'reading' | 'error'>('idle');
    const [isReading, setIsReading] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
    const [poolDetails, setPoolDetails] = useState<PoolDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const isNfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

    const fetchPoolDetails = useCallback(async () => {
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            )

            // Get pool details
            const details = await contract.getPoolDetails(poolId);
            setPoolDetails({
                name: details.name,
                checkpoints: details.checkpoints,
                currentCheckpointIndex: Number(details.currentCheckpointIndex)
            });

            // Get pool items
            const items = await contract.getPoolItems(poolId);
            setTotalPoolItems(items.length);
        } catch (error) {
            console.error("Error fetching pool details:", error);
        } finally {
            setLoading(false);
        }
    }, [walletProvider, poolId]);

    useEffect(() => {
        if (isConnected && walletProvider) {
            fetchPoolDetails();
        }
    }, [isConnected, walletProvider, fetchPoolDetails]);

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&language=en`
            );

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const country = data.results[0].components.country;
                setLocation(country);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Unable to get your location. Please enter it manually.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const fetchItemDetails = async (tokenId: string) => {
        try {
            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            )
            const details = await contract.getItemDetails(tokenId);
            return {
                name: details.name,
                currentLocation: details.currentLocation
            };
        } catch (error) {
            console.error("Error fetching item details:", error);
            return null;
        }
    };

    const startScanning = async () => {
        if (!isNfcSupported) {
            alert('NFC is not supported on this device');
            return;
        }

        try {
            setIsReading(true);
            setReadStatus('reading');

            // @ts-expect-error - TypeScript might not have NDEFReader types
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.addEventListener("reading", async ({ message }: { message: { records: { data: Uint8Array }[] } }) => {
                const txHash = new TextDecoder().decode(message.records[0].data);

                try {
                    const provider = new ethers.BrowserProvider(
                        walletProvider as Eip1193Provider
                    )
                    const signer = await provider.getSigner()
                    const contract = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        ABI,
                        signer
                    )

                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (!receipt) return;

                    const iface = new ethers.Interface(ABI);
                    for (const log of receipt.logs) {
                        try {
                            const parsedLog = iface.parseLog(log);
                            if (parsedLog?.name === "ItemCreated") {
                                const tokenId = parsedLog.args[0].toString();

                                // Check if item belongs to this pool
                                const details = await fetchItemDetails(tokenId);
                                if (details) {
                                    // Move the duplicate check outside and use setScannedItems with a callback
                                    setScannedItems(prev => {
                                        // Check if item already exists in the array
                                        if (prev.some(item => item.tokenId === tokenId)) {
                                            return prev; // Return unchanged array if item exists
                                        }
                                        // Add new item if it doesn't exist
                                        return [...prev, {
                                            tokenId,
                                            txHash,
                                            details
                                        }];
                                    });
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                } catch (error) {
                    console.error("Error processing NFC data:", error);
                }

                // After successful scan, update the reading status
                setReadStatus('idle');
                setIsReading(false);
            });

        } catch (error) {
            console.error("Error starting NFC scan:", error);
            setReadStatus('error');
            setIsReading(false);
        }
    };

    const updateLocations = async () => {
        if (!location) {
            alert('Please set a location first');
            return;
        }

        // Verify location is a valid checkpoint
        if (poolDetails && !poolDetails.checkpoints.includes(location)) {
            alert('Location must be one of the checkpoints: ' + poolDetails.checkpoints.join(', '));
            return;
        }

        try {
            setUpdateStatus('updating');
            const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

            const tx = await contract.updatePoolItemsLocation(poolId, location);
            await tx.wait();

            setUpdateStatus('success');
            alert('Locations updated successfully!');
            router.push('/updateItemLocation'); // Return to pools list
        } catch (error) {
            console.error("Error updating locations:", error);
            setUpdateStatus('error');
            alert('Failed to update locations. Please try again.');
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center min-h-screen p-8">
                <div className="w-full max-w-md">
                    <div className="p-4 bg-[#0c252a] text-[#d9ff56] rounded-lg border border-[#d9ff56]/20">
                        Please connect your wallet to continue.
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center min-h-screen p-8">
                <div className="w-full max-w-md text-center text-white">
                    <div className="animate-spin h-8 w-8 border-4 border-[#d9ff56] border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading pool details...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <div className="w-full max-w-md">
                {/* Main Container Box */}
                <div className="mb-8 p-6 bg-[#0c252a] border border-[#d9ff56]/20 rounded-xl shadow-xl">
                    <h1 className="text-2xl font-bold text-center mb-6 text-white">
                        {poolDetails?.name || `Pool ${poolId}`}
                    </h1>

                    <div className="mb-6">
                        <p className="text-center text-gray-300">
                            Scanned: {scannedItems.length} / {totalPoolItems} items
                        </p>
                        {poolDetails && (
                            <div className="mt-4 p-3 bg-[#0c252a] border border-[#d9ff56]/20 rounded-lg text-white">
                                <p className="text-sm font-medium">Valid Checkpoints:</p>
                                <p className="text-sm">{poolDetails.checkpoints.join(' → ')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-white">Next Location</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter checkpoint location"
                                className="flex-1 p-3 bg-white/10 border border-[#d9ff56]/20 rounded-lg focus:ring-2 focus:ring-[#d9ff56] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                            />
                            <button
                                onClick={getCurrentLocation}
                                disabled={isLoadingLocation}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isLoadingLocation
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                    }`}
                            >
                                {isLoadingLocation ? "Loading..." : "📌"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={startScanning}
                            disabled={isReading}
                            className={`w-full p-3 rounded-lg font-medium transition-all duration-200 ${isReading
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                }`}
                        >
                            {isReading ? "Scanning... (Tap NFC tags)" : "Start Scanning NFCs"}
                        </button>

                        <button
                            onClick={updateLocations}
                            disabled={scannedItems.length !== totalPoolItems || !location || updateStatus === 'updating'}
                            className={`w-full p-3 rounded-lg font-medium transition-all duration-200 ${scannedItems.length !== totalPoolItems || !location || updateStatus === 'updating'
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                }`}
                        >
                            {updateStatus === 'updating' ? 'Updating...' : 'Update Locations'}
                        </button>
                    </div>
                </div>

                {/* Scanned Items Section */}
                {scannedItems.length > 0 && (
                    <div className="p-6 bg-[#0c252a] border border-[#d9ff56]/20 rounded-xl shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-white">Scanned Items</h2>
                        <div className="space-y-2">
                            {scannedItems.map((item, index) => (
                                <div key={index} className="p-3 bg-white/5 border border-[#d9ff56]/20 rounded-lg">
                                    <p className="font-medium text-white">{item.details?.name || `Item ${item.tokenId}`}</p>
                                    <p className="text-sm text-gray-300">Token ID: {item.tokenId}</p>
                                    <p className="text-sm text-gray-300">
                                        Current Location: {item.details?.currentLocation}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Tx: {item.txHash.slice(0, 10)}...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}