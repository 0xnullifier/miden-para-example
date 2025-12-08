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
  const newSendTransactionRequestStart = performance.now();
  const sendTxRequest = midenParaClient.newSendTransactionRequest(
    fromAddr.accountId(),
    toAddr.accountId(),
    AccountId.fromHex(faucetId),
    NoteType.Private,
    amount * BigInt(1e8)
  );
  const newSendTransactionRequestTime =
    performance.now() - newSendTransactionRequestStart;
  const outputNote = sendTxRequest.expectedOutputOwnNotes()[0];
  const executeStart = performance.now();
  const executedTx = await midenParaClient.executeTransaction(
    fromAddr.accountId(),
    sendTxRequest
  );
  const executeTransactionTime = performance.now() - executeStart;

  const proveStart = performance.now();
  const provenTx = await midenParaClient.proveTransaction(executedTx);
  const proveTransactionTime = performance.now() - proveStart;

  const submitStart = performance.now();
  const submissionHeight = await midenParaClient.submitProvenTransaction(
    provenTx,
    executedTx
  );
  const submitProvenTransactionTime = performance.now() - submitStart;

  await midenParaClient.applyTransaction(executedTx, submissionHeight);

  await midenParaClient.sendPrivateNote(
    outputNote,
    Address.fromBech32(toAddress)
  );
  return {
    txHash: executedTx.executedTransaction().id().toHex(),
    performance: {
      executeTransactionTime,
      proveTransactionTime,
      submitProvenTransactionTime,
      newSendTransactionRequestTime,
    },
  };
}
