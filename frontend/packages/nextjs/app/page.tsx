"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { abi } from "../../hardhat/artifacts/contracts/FairLaunchpad.sol/FairLaunchpad.json";
import { abi as TokenAbi } from "../../hardhat/artifacts/contracts/MyToken.sol/MyToken.json";
import { readContract } from "@wagmi/core";
import type { NextPage } from "next";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { AdminDashboard } from "~~/components/custom/AdminDashboard";
import { InvestorArea } from "~~/components/custom/InvestorArea";
import { LaunchpadInfo } from "~~/components/custom/LaunchpadInfo";
import { Address } from "~~/components/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnecting, isDisconnected } = useAccount();
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [winnersChosen, setWinnersChosen] = useState(false);
  const [eventHash, setEventHash] = useState("");
  const [eventInvestorJoinHash, setEventInvestorJoinHash] = useState("");
  const [eventWinnerChosenHash, setEventWinnerChosenHash] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [participants, setParticipants] = useState(0n);

  const {
    data: owner,
    isError,
    isLoading,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    functionName: "owner",
  });

  const {
    data: isOpen,
    isError: isErrorLaunchpadOpen,
    isLoading: isLoadingLaunchpadOpen,
    refetch,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    functionName: "started",
  });

  const {
    data: participantsCounter,
    isError: isErrorPartCount,
    isLoading: isLoadingPartCount,
    refetch: fetchParticipants,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    functionName: "getCandidatesCount",
  });

  const {
    data: wChosen,
    isError: isErrorWChosen,
    isLoading: isLoadingWChosen,
    refetch: refetchWinnersChosen,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "winnersChosen",
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "LaunchpadStarted",
    onLogs(log: any) {
      console.log("Event launchpad Started!", log[0]);
      setEventHash(log[0].blockHash);
    },
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "InvestorJoined",
    onLogs(log: any) {
      console.log("New investor onboard!", log[0]);
      setEventInvestorJoinHash(log[0].blockHash);
    },
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT,
    abi,
    eventName: "WinnersChosen",
    onLogs(logs: any) {
      console.log("WinnersChosen event!", logs[0]);
      setEventWinnerChosenHash(logs[0].blockHash);
    },
  });

  const getTokenData = async () => {
    const tokenN = await readContract(wagmiConfig, {
      address: process.env.NEXT_PUBLIC_TOKEN_CONTRACT as `0x${string}`,
      abi: TokenAbi,
      functionName: "name",
    });

    const tokenS = await readContract(wagmiConfig, {
      address: process.env.NEXT_PUBLIC_TOKEN_CONTRACT as `0x${string}`,
      abi: TokenAbi,
      functionName: "symbol",
    });

    setTokenName(tokenN as string);
    setTokenSymbol(tokenS as string);
  };

  useEffect(() => {
    refetch().then(({ data: isOpen }) => {
      setLaunchpadOpen(isOpen as boolean);
    });
  }, [connectedAddress, eventHash]);

  useEffect(() => {
    fetchParticipants().then(({ data: participantsCounter }) => {
      setParticipants(participantsCounter as bigint);
    });
  }, [eventInvestorJoinHash]);

  useEffect(() => {
    refetchWinnersChosen().then(({ data: winnerChosen }) => {
      setWinnersChosen(winnerChosen as boolean);
    });
  }, [connectedAddress, eventWinnerChosenHash]);

  useEffect(() => {
    getTokenData();
  }, []);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">FairPad</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="card w-128 bg-primary text-primary-content mt-4" style={{ width: "550px" }}>
            <div className="card-body" style={{ maxWidth: "550", wordWrap: "break-word" }}>
              <LaunchpadInfo
                address={connectedAddress as `0x{string}`}
                tokenName={tokenName}
                tokenSymbol={tokenSymbol}
                launchpadOpen={launchpadOpen}
                winnersChosen={winnersChosen}
              />
            </div>
          </div>
          {(owner as `0x{string}`) == connectedAddress && (
            <div className="card w-128 bg-primary text-primary-content mt-4" style={{ width: "550px" }}>
              <div className="card-body" style={{ maxWidth: "550", wordWrap: "break-word" }}>
                <AdminDashboard
                  address={connectedAddress}
                  participants={participants}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  launchpadOpen={launchpadOpen}
                  setLaunchpadOpen={setLaunchpadOpen}
                  winnersChosen={winnersChosen}
                />
              </div>
            </div>
          )}
          {launchpadOpen && (
            <div className="card w-128 bg-primary text-primary-content mt-4" style={{ width: "550px" }}>
              <div className="card-body" style={{ maxWidth: "550", wordWrap: "break-word" }}>
                <InvestorArea
                  address={connectedAddress as `0x{string}`}
                  launchpadOpen={launchpadOpen}
                  setLaunchpadOpen={setLaunchpadOpen}
                  participants={participants}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  winnersChosen={winnersChosen}
                />
              </div>
            </div>
          )}
          {/* <TokenWalletWrapper address={connectedAddress as `0x${string}`} isConnecting={isConnecting} isDisconnected={isDisconnected}></TokenWalletWrapper> */}
        </div>
      </div>
    </>
  );
};

export default Home;
