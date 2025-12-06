export async function send(
  midenParaClient: import("@demox-labs/miden-sdk").WebClient,
  fromAddress: string,
  toAddress: string,
  faucetId: string,
  amount: bigint
) {
  const { Address, AccountId, NoteType } = await import(
    "@demox-labs/miden-sdk"
  );

  const toAddr = Address.fromBech32(toAddress);
  const fromAddr = Address.fromBech32(fromAddress);

  await midenParaClient.syncState();
  const sendTxRequest = midenParaClient.newSendTransactionRequest(
    fromAddr.accountId(),
    toAddr.accountId(),
    AccountId.fromHex(faucetId),
    NoteType.Private,
    amount * BigInt(1e8)
  );
  const outputNote = sendTxRequest.expectedOutputOwnNotes()[0];

  const sendTx = await midenParaClient.submitNewTransaction(
    fromAddr.accountId(),
    sendTxRequest
  );

  await midenParaClient.sendPrivateNote(
    outputNote,
    Address.fromBech32(toAddress)
  );
  return sendTx.toHex();
}
