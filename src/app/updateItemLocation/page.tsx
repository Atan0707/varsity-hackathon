"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider } from "ethers";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS } from "@/utils/config";
import ABI from "../../contract/abi.json";
import Link from "next/link";

export default function PoolsPage() {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");
    const [pools, setPools] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && walletProvider) {
            fetchPools();
        }
    }, [isConnected, walletProvider]);

    const fetchPools = async () => {
        try {
            setLoading(true);
            setError(null);

            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            )

            const poolsData = await contract.getAllPools();
            const formattedPools = poolsData[0].map((id: number, index: number) => ({
                id: Number(id),
                name: poolsData[1][index]
            }));

            setPools(formattedPools);
        } catch (error) {
            console.error("Error fetching pools:", error);
            setError("Failed to fetch pools. Please make sure your wallet is connected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Available Donation Pools
                </h1>

                {!isConnected && (
                    <div className="p-4 mb-4 bg-yellow-50 text-yellow-800 rounded-lg">
                        Please connect your wallet to view pools.
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center p-4">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading pools...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pools.length === 0 ? (
                            <div className="text-center p-4 bg-blue-500 rounded-lg">
                                No pools available.
                            </div>
                        ) : (
                            pools.map((pool) => (
                                <Link
                                    href={`/updateItemLocation/${pool.id}`}
                                    key={pool.id}
                                    className="block p-4 bg-blue-500 shadow rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <h2 className="text-xl font-semibold">{pool.name}</h2>
                                    <p className="text-gray-200">Pool ID: {pool.id}</p>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}