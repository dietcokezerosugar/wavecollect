const template = "eyJjb250YWN0Ijp7ImNic05hbWUiOiIiLCJuaWNrTmFtZSI6Ikdvb2dsZSBQYXkgTWVyY2hhbnQiLCJ2cGEiOiJncGF5LTEyMTkxNDU0MTg3QG9rYml6YXhpcyIsInR5cGUiOiJWUEEifSwicDJwUGF5bWVudENoZWNrb3V0UGFyYW1zIjp7Im5vdGUiOiJ5d2s4b1RIaGRmc1UiLCJpc0J5RGVmYXVsdEtub3duQ29udGFjdCI6dHJ1ZSwiZW5hYmxlU3BlZWNoVG9UZXh0IjpmYWxzZSwiYWxsb3dBbW91bnRFZGl0IjpmYWxzZSwic2hvd1FyQ29kZU9wdGlvbiI6ZmFsc2UsImRpc2FibGVWaWV3SGlzdG9yeSI6dHJ1ZSwic2hvdWxkU2hvd1Vuc2F2ZWRDb250YWN0QmFubmVyIjpmYWxzZSwiaXNSZWN1cnJpbmciOmZhbHNlLCJjaGVja291dFR5cGUiOiJERUZBVUxUIiwidHJhbnNhY3Rpb25Db250ZXh0IjoicDJwIiwiaW5pdGlhbEFtb3VudCI6MTAwLCJkaXNhYmxlTm90ZXNFZGl0Ijp0cnVlLCJzaG93S2V5Ym9hcmQiOmZhbHNlLCJjdXJyZW5jeSI6IklOUiIsInNob3VsZFNob3dNYXNrZWROdW1iZXIiOnRydWV9fQ==";

const merchantName = "Google Pay Merchant";
const payeeVpa = "gpay-12191454187@okbizaxis";
const finalOrderId = "ywk8oTHhdfsU";
const amount = "1.00";

const phonepePayload = JSON.stringify({
  contact: { cbsName: "", nickName: merchantName, vpa: payeeVpa, type: "VPA" },
  p2pPaymentCheckoutParams: {
    note: finalOrderId,
    isByDefaultKnownContact: true,
    enableSpeechToText: false,
    allowAmountEdit: false,
    showQrCodeOption: false,
    disableViewHistory: true,
    shouldShowUnsavedContactBanner: false,
    isRecurring: false,
    checkoutType: "DEFAULT",
    transactionContext: "p2p",
    initialAmount: Math.round(parseFloat(amount) * 100),
    disableNotesEdit: true,
    showKeyboard: false,
    currency: "INR",
    shouldShowMaskedNumber: true
  }
});

const generated = Buffer.from(phonepePayload).toString("base64");

console.log("Template Length:  ", template.length);
console.log("Generated Length: ", generated.length);
console.log("Match exactly?    ", template === generated);
if (template !== generated) {
  console.log("Generated Base64:\n", generated);
}
