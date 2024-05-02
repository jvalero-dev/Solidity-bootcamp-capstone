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
  winnersChosen: boolean;
}) {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonRedeemLoading, setButtonRedeemLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [staked, setStaked] = useState(BigInt(0));
  const [projectRedeemed, setProjectRedeemed] = useState(false);

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

  const {
    data: redeemed,
    isError: isErrorRedeemed,
    isLoading: isLoadingRedeemed,
    refetch: refetchProjectRedeemed,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "projectRedeemed",
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "OwnerRedeemsProject",
    onLogs(logs: any) {
      setEventHash(logs[0].blockHash);
    },
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

  const handleClickRedeem = async function () {
    setButtonRedeemLoading(true);

    let txHash;
    try {
      const hash = await writeContract(wagmiConfig, {
        address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
        abi,
        functionName: "projectRedeem",
      });
      txHash = hash;

      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        confirmations: 1,
        hash: txHash,
      });

      setStatus("Launchpad redeemed!");
      params.setLaunchpadOpen(true);
    } catch (error) {
      console.log(error);
    } finally {
      setButtonRedeemLoading(false);
    }
  };

  useEffect(() => {
    refetchBalance().then(({ data: balance }) => {
      setStaked(balance?.value!);
    });
  }, [params.participants, eventHash]);

  useEffect(() => {
    refetchProjectRedeemed().then(({ data: redeemed }) => {
      setProjectRedeemed(redeemed as boolean);
    });
  }, [eventHash]);

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
            ADMIN
          </p>

          {params.launchpadOpen && (
            <div>
              <p style={{ marginBottom: "0px" }}>Staked balance: {formatEther(staked)} ETH</p>
            </div>
          )}

          {status.length > 0 && (
            <div>
              <p className="my-2 font-bold" style={{ marginBottom: "0px" }}>
                {status}
              </p>
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
          {params.launchpadOpen && params.winnersChosen && (
            <button
              className="btn btn-active btn-neutral"
              style={{ marginTop: "20px" }}
              disabled={projectRedeemed}
              onClick={handleClickRedeem}
            >
              {!buttonRedeemLoading ? (
                <span>Redeem Launchpad</span>
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
