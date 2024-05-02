"use client";

export function LaunchpadInfo(params: {
  address: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  launchpadOpen: boolean;
}) {
  return (
    <div className="grid">
      <p className="my-2 font-extrabold" style={{ justifySelf: "center" }}>
        INFO
      </p>
      <div>
        <p style={{ marginBottom: "0px" }}>Status: {params.launchpadOpen ? "Active" : "Inactive"}</p>
        <p style={{ marginBottom: "0px" }}>
          Token: {params.tokenName}({params.tokenSymbol})
        </p>
      </div>
    </div>
  );
}
