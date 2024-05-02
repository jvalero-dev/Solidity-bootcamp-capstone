"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { abi } from "../../../hardhat/artifacts/contracts/FairLaunchpad.sol/FairLaunchpad.json";
import { abi as TokenAbi } from "../../../hardhat/artifacts/contracts/MyToken.sol/MyToken.json";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { formatEther } from "viem";
import { useBalance, useReadContract, useWatchContractEvent } from "wagmi";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

export function AdminDashboard(params: {
  address: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  setLaunchpadOpen: Dispatch<SetStateAction<boolean>>;
  launchpadOpen: boolean;
  participants: bigint;
}) {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [staked, setStaked] = useState(BigInt(0));

  const [eventHash, setEventHash] = useState("");

  const {
    data: balance,
    error,
    isError: isErrorStakedBalance,
    isLoading: isLoadingStakedBalance,
    refetch: refetchBalance,
  } = useBalance({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
  });

  const handleClick = async function () {
    setButtonLoading(true);

    let txHash;
    try {
      const hash = await writeContract(wagmiConfig, {
        address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
        abi,
        functionName: "start",
        args: [process.env.NEXT_PUBLIC_LAUNCHPAD_DURATION],
      });
      txHash = hash;

      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        confirmations: 1,
        hash: txHash,
      });

      console.log("Launchpad is now open!! Tx hash: ", txHash);
      setStatus("Launchpad started!");
      params.setLaunchpadOpen(true);
    } catch (error) {
      console.log(error);
    } finally {
      setButtonLoading(false);
    }
  };

  useEffect(() => {
    refetchBalance().then(({ data: balance }) => {
      setStaked(balance?.value!);
    });
  }, [params.participants]);

  useEffect(() => {
    setStatus("");
  }, [params.address]);

  return (
    <>
      {isLoadingStakedBalance ? (
        <div>Loading...</div>
      ) : isErrorStakedBalance ? (
        <div>Error fetching Balance: {error.toString()} </div>
      ) : (
        <div className="grid">
          <p className="my-2 font-extrabold" style={{ justifySelf: "center" }}>
            Launchpad Admin
          </p>

          {params.launchpadOpen && (
            <div>
              <p style={{ marginBottom: "0px" }}>Staked balance: {formatEther(staked)} ETH</p>
            </div>
          )}

          {status.length > 0 && (
            <div>
              <p style={{ marginBottom: "0px" }}>{status}</p>
            </div>
          )}

          {!params.launchpadOpen && (
            <button className="btn btn-active btn-neutral" style={{ marginTop: "20px" }} onClick={handleClick}>
              {!buttonLoading ? (
                <span>Start Launchpad</span>
              ) : (
                <span className="loading loading-spinner loading-xs"></span>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
