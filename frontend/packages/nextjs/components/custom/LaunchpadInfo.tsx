"use client";

import { abi } from "../../../hardhat/artifacts/contracts/FairLaunchpad.sol/FairLaunchpad.json";
import { useReadContract } from "wagmi";

export function LaunchpadInfo(params: {
  address: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  launchpadOpen: boolean;
  winnersChosen: boolean;
}) {
  const {
    data: maxInvestors,
    isError: isErrorMaxInv,
    isLoading: isLoadingMaxInv,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAIR_LAUNCHPAD_CONTRACT as `0x${string}`,
    abi,
    functionName: "maxInvestors",
  });

  return (
    <>
      {isLoadingMaxInv ? (
        <div>Loading...</div>
      ) : isErrorMaxInv ? (
        <div>Error fetching Investor data</div>
      ) : (
        <div className="grid">
          <p className="my-2 font-extrabold" style={{ justifySelf: "center" }}>
            INFO
          </p>
          <div>
            <p className="my-2 font-bold" style={{ marginBottom: "0px" }}>
              Status:{" "}
              {params.launchpadOpen && !params.winnersChosen
                ? "Active"
                : params.launchpadOpen && params.winnersChosen
                ? "Closed"
                : "Inactive"}
            </p>
            <p className="my-2 font-bold" style={{ marginBottom: "0px" }}>
              Token: {params.tokenName}({params.tokenSymbol})
            </p>
            <p className="my-2 font-bold" style={{ marginBottom: "0px" }}>
              Max number investors: {(maxInvestors as bigint).toString()}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
