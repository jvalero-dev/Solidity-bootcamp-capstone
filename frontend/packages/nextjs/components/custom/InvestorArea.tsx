"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { abi } from "../../../hardhat/artifacts/contracts/FairLaunchpad.sol/FairLaunchpad.json";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { formatEther } from "viem";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

export function InvestorArea(params: {
  address: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  participants: bigint;
  setLaunchpadOpen: Dispatch<SetStateAction<boolean>>;
  launchpadOpen: boolean;
  winnersChosen: boolean;
}) {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonLaunchDistLoading, setButtonLaunchDistLoading] = useState(false);
  const [buttonClaimTokensLoading, setButonClaimTokensLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isInvestor, setIsInvestor] = useState(false);
  const [isChosen, setIsChosen] = useState(false);
  const [eventInvestedHash, setEventInvestedHash] = useState("");

  const {
    data: investmentAmount,
    isError: isErrorInvAmount,
    isLoading: isLoadingInvAmount,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "investmentAmount",
  });

  const {
    data: maxInvestors,
    isError: isErrorMaxInv,
    isLoading: isLoadingMaxInv,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "maxInvestors",
  });

  const {
    data: isInvested,
    isError: isErrorInvested,
    isLoading: isLoadingInvested,
    refetch: refetchIsInvestor,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "invested",
    args: [params.address],
  });

  const {
    data: chosen,
    isError: isErrorChosen,
    isLoading: isLoadingChosen,
    refetch: refetchIsChosen,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "isChosen",
    args: [params.address],
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "InvestorJoined",
    onLogs(logs: any) {
      console.log("New investor onboard!", logs[0]);
      if ((logs[0].args.investor as `0x${string}`) == params.address) {
        setEventInvestedHash(logs[0].blockHash);
      }
    },
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "InvestorClaimedTokens",
    onLogs(logs: any) {
      console.log("Investor tokens claimed!", logs[0]);
      if ((logs[0].args.investor as `0x${string}`) == params.address) {
        setStatus(`${logs[0].args.amount} Tokens claimed`);
        setEventInvestedHash(logs[0].blockHash);
      }
    },
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "InvestorRecoveredInvestment",
    onLogs(logs: any) {
      console.log("Investor recovered investment!", logs[0]);
      if ((logs[0].args.investor as `0x${string}`) == params.address) {
        setStatus(`${logs[0].args.investmentAmount} ETH returned to user`);
        setEventInvestedHash(logs[0].blockHash);
      }
    },
  });

  const handleClick = async function () {
    setButtonLoading(true);

    let txHash;
    try {
      const hash = await writeContract(wagmiConfig, {
        address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
        abi,
        functionName: "join",
        value: investmentAmount as bigint,
      });
      txHash = hash;

      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        confirmations: 1,
        hash: txHash,
      });

      setStatus("Participation accepted!");
    } catch (error) {
      console.log(error);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleWinnersPickClick = async function () {
    setButtonLaunchDistLoading(true);

    let txHash;
    try {
      const hash = await writeContract(wagmiConfig, {
        address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
        abi,
        functionName: "chooseWinners",
      });
      txHash = hash;

      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        confirmations: 1,
        hash: txHash,
      });

      setStatus("Distribution completed!");
    } catch (error) {
      console.log(error);
    } finally {
      setButtonLaunchDistLoading(false);
    }
  };

  const handleClaimTokensClick = async function () {
    setButonClaimTokensLoading(true);

    let txHash;
    try {
      const hash = await writeContract(wagmiConfig, {
        address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
        abi,
        functionName: "redeem",
      });
      txHash = hash;

      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        confirmations: 1,
        hash: txHash,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setButonClaimTokensLoading(false);
    }
  };

  useEffect(() => {
    refetchIsInvestor().then(({ data: isInvested }) => {
      setIsInvestor(isInvested as boolean);
    });
  }, [params.address, eventInvestedHash]);

  useEffect(() => {
    refetchIsChosen().then(({ data: isChosen }) => {
      setIsChosen(isChosen as boolean);
    });
  }, [params.address, params.winnersChosen]);

  useEffect(() => {
    setStatus("");
  }, [params.address]);

  return (
    <>
      {isLoadingInvAmount || isLoadingMaxInv || isLoadingInvested ? (
        <div>Loading...</div>
      ) : isErrorInvAmount || isErrorMaxInv || isErrorInvested ? (
        <div>Error fetching Investor data</div>
      ) : (
        <div className="grid">
          <p className="my-2 font-extrabold" style={{ justifySelf: "center" }}>
            Participation
          </p>
          <div>
            <p style={{ marginBottom: "0px" }}>
              Participants: {params.participants.toString()} / {(maxInvestors as bigint).toString()}
            </p>
          </div>
          <div>
            <p style={{ marginBottom: "0px" }}>
              Stake {formatEther(investmentAmount as bigint)} ETH to join the launchpad.
            </p>
            <button
              className="btn btn-active btn-neutral"
              style={{ marginTop: "20px" }}
              disabled={isInvestor || params.winnersChosen}
              onClick={handleClick}
            >
              {!buttonLoading ? <span>Participate</span> : <span className="loading loading-spinner loading-xs"></span>}
            </button>

            {status.length > 0 && (
              <div>
                <p style={{ marginBottom: "0px" }}>{status}</p>
              </div>
            )}

            {params.participants > 0 && !params.winnersChosen && isInvestor && (
              <button
                className="btn btn-active btn-neutral"
                style={{ marginTop: "20px" }}
                onClick={handleWinnersPickClick}
              >
                {!buttonLaunchDistLoading ? (
                  <span>Launch distribution</span>
                ) : (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
              </button>
            )}
            {params.winnersChosen && isChosen && isInvestor && (
              <button
                className="btn btn-active btn-neutral"
                style={{ marginTop: "20px" }}
                onClick={handleClaimTokensClick}
              >
                {!buttonClaimTokensLoading ? (
                  <span>Claim Tokens</span>
                ) : (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
              </button>
            )}
            {params.winnersChosen && !isChosen && isInvestor && (
              <button
                className="btn btn-active btn-neutral"
                style={{ marginTop: "20px" }}
                onClick={handleClaimTokensClick}
              >
                {!buttonClaimTokensLoading ? (
                  <span>Return stake</span>
                ) : (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
