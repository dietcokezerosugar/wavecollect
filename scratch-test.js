const template = "eyJjb250YWN0Ijp7ImNic05hbWUiOiIiLCJuaWNrTmFtZSI6IlNreWx5biBUZWNobm9sb2d5IiwidnBhIjoiZ3BheS0xMjIwNTI4NDg2NEBva2JpemF4aXMiLCJ0eXBlIjoiVlBBIn0sInAycFBheW1lbnRDaGVja291dFBhcmFtcyI6eyJub3RlIjoidkNRMWtta3kwR3ZFIiwiaXNCeURlZmF1bHRLbm93bkNvbnRhY3QiOnRydWUsImVuYWJsZVNwZWVjaFRvVGV4dCI6ZmFsc2UsImFsbG93QW1vdW50RWRpdCI6ZmFsc2UsInNob3dRckNvZGVPcHRpb24iOmZhbHNlLCJkaXNhYmxlVmlld0hpc3RvcnkiOnRydWUsInNob3VsZFNob3dVbnNhdmVkQ29udGFjdEJhbm5lciI6ZmFsc2UsImlzUmVjdXJyaW5nIjpmYWxzZSwiY2hlY2tvdXRUeXBlIjoiREVGQVVMVCIsInRyYW5zYWN0aW9uQ29udGV4dCI6InAycCIsImluaXRpYWxBbW91bnQiOjEwMCwiZGlzYWJsZU5vdGVzRWRpdCI6dHJ1ZSwic2hvd0tleWJvYXJkIjpmYWxzZSwiY3VycmVuY3kiOiJJTlIiLCJzaG91bGRTaG93TWFza2VkTnVtYmVyIjp0cnVlfX0=";

const merchantName = "Skylyn Technology";
const payeeVpa = "gpay-12205284864@okbizaxis";
const finalOrderId = "vCQ1kmky0GvE";
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
