/**
 * Helper functions to generate proprietary UPI intent URLs for PhonePe, Paytm, and GPay.
 * Strictly follows the logic provided for "Native" flows.
 */

export interface PhonePeIntentConfig {
  merchant_upi: string;
  order_id: string;
  amount: number;
  isAndroid?: boolean;
}

export interface PaytmIntentConfig {
  merchant_upi: string;
  merchant_business_name: string;
  amount: number;
  order_id: string;
  isAndroid?: boolean;
}

export interface GPayIntentConfig {
  merchant_upi: string;
  merchant_business_name: string;
  amount: number;
  order_id: string;
  isAndroid?: boolean;
}

export interface UpiParams {
  pa: string;         // Payee VPA / UPI ID
  pn: string;         // Payee Name (Business Name)
  am?: number | string; // Amount in rupees (Optional for dynamic open payments)
  tr?: string;        // Transaction Reference ID (Order ID)
  tn?: string;        // Transaction Note (Description)
  cu?: string;        // Currency (Default: INR)
  mc?: string;        // Merchant Category Code (Default: 0000)
  mode?: string;      // Transaction Mode (Default: 02 - Payee Initiated)
  tid?: string;       // Transaction ID
  url?: string;       // Transaction Reference URL
}

/**
 * Builds the base upi://pay deeplink.
 */
export function buildUpiDeeplink(params: UpiParams): string {
  const searchParams = new URLSearchParams();
  searchParams.append("pa", params.pa);
  searchParams.append("pn", params.pn || "Merchant");
  
  if (params.am !== undefined && params.am !== null) {
      const amountStr = typeof params.am === "number" ? params.am.toFixed(2) : String(params.am);
      searchParams.append("am", amountStr);
  }
  
  if (params.tr) searchParams.append("tr", params.tr);
  if (params.tn) searchParams.append("tn", params.tn);
  if (params.tid) searchParams.append("tid", params.tid);
  if (params.url) searchParams.append("url", params.url);
  
  searchParams.append("cu", params.cu || "INR");
  
  if (params.mc && params.mc !== "0000") searchParams.append("mc", params.mc);
  if (params.mode) searchParams.append("mode", params.mode);

  const queryString = searchParams.toString().replace(/\+/g, "%20").replace(/%40/g, "@");
  return `upi://pay?${queryString}`;
}

/**
 * Generates the PhonePe "Native" flow intent URL.
 */
export function generatePhonePeIntent({ merchant_upi, order_id, amount, isAndroid = true }: PhonePeIntentConfig): string {
  if (!isAndroid) {
    // iOS: Standard direct scheme (God-Tier for iPhone)
    return `phonepe://pay?pa=${merchant_upi}&pn=Merchant&am=${amount}&tn=${order_id}&cu=INR`;
  }

  // Android: Proprietary "Native" flow
  const data = {
    contact: {
      cbsName: "",
      nickName: "",
      vpa: merchant_upi,
      type: "VPA"
    },
    p2pPaymentCheckoutParams: {
      note: order_id,
      isByDefaultKnownContact: true,
      enableSpeechToText: false,
      allowAmountEdit: false,
      showQrCodeOption: false,
      disableViewHistory: true,
      shouldShowUnsavedContactBanner: false,
      isRecurring: false,
      checkoutType: "DEFAULT",
      transactionContext: "p2p",
      initialAmount: Math.floor(amount * 100), // Amount in paise
      disableNotesEdit: true,
      showKeyboard: false,
      currency: "INR",
      shouldShowMaskedNumber: true
    }
  };

  const jsonStr = JSON.stringify(data);
  const base64 = typeof window !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(jsonStr)))
    : Buffer.from(jsonStr).toString('base64');

  return `phonepe://native?data=${base64}&id=p2ppayment`;
}

/**
 * Generates the Paytm specific intent flow URL.
 */
export function generatePaytmIntent({ merchant_upi, merchant_business_name, amount, order_id, isAndroid = true }: PaytmIntentConfig): string {
  const params = new URLSearchParams({
    pa: merchant_upi,
    pn: merchant_business_name,
    am: amount.toString(),
    cu: "INR",
    tn: order_id,
    tr: order_id,
    mc: "4722",
    featuretype: "money_transfer"
  });

  if (!isAndroid) {
    // iOS: Standard universal fallback for Paytm
    return `paytmmp://cash_wallet?${params.toString()}`;
  }

  // Android: Proprietary signature and category code (mc=4722)
  const signature = "AAuN7izDWN5cb8A5scnUiNME+LkZqI2DWgkXlN1McoP6WZABa/KkFTiLvuPRP6/nWK8BPg/rPhb+u4QMrUEX10UsANTDbJaALcSM9b8Wk218X+55T/zOzb7xoiB+BcX8yYuYayELImXJHIgL/c7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr";
  params.append("sign", signature);

  return `paytmmp://cash_wallet?${params.toString()}`;
}

/**
 * Generates a "God-Tier" GPay intent URL.
 */
export function generateGPayIntent({ merchant_upi, merchant_business_name, amount, order_id, isAndroid = true }: GPayIntentConfig): string {
  const params = new URLSearchParams({
    pa: merchant_upi,
    pn: merchant_business_name,
    am: amount.toString(),
    cu: "INR",
    tn: order_id,
    tr: order_id,
    mc: "5411"
  });

  const baseUrl = "https://pay.google.com/gp/p/ui/pay";
  const profileUrl = `${baseUrl}?${params.toString()}`;

  if (isAndroid) {
    // Android: Use the "Trick" Profile URI with explicit intent targeting
    // This launches the "Pay to Contact" interface directly.
    return `intent://pay.google.com/gp/p/ui/pay?${params.toString()}#Intent;scheme=https;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=${encodeURIComponent(profileUrl)};end`;
  }

  // iOS: Use the raw HTTPS profile URL which triggers the GPay Universal Link.
  return profileUrl;
}

/**
 * Generates a standard Android Intent URL for a specific UPI app.
 */
export function generateAppIntent(packageName: string, upiUrl: string): string {
  if (!upiUrl.startsWith('upi://pay?')) return upiUrl;
  const params = upiUrl.split('?')[1];
  return `intent://pay?${params}#Intent;scheme=upi;package=${packageName};end`;
}

export function buildAndroidIntent(upiUrl: string, packageName: string): string {
  return generateAppIntent(packageName, upiUrl);
}

export function openIntent(url: string | null): void {
  if (typeof window !== 'undefined' && url) {
    window.location.href = url;
  }
}
