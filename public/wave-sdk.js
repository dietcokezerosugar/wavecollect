/**
 * WaveCollect Client-Side SDK v1.0
 * Lightweight, zero-dependency SDK for Custom Checkout integrations.
 */
(function (window) {
  const WaveCollect = {
    _token: null,
    _interval: null,
    _config: {
      baseUrl: "https://payxmint.com", // Default production URL
      pollInterval: 1000,
    },
    
    setBaseUrl: function(url) {
      this._config.baseUrl = url;
      return this;
    },
    _handlers: {
      onSuccess: null,
      onExpire: null,
      onError: null,
      onStatusUpdate: null,
    },

    /**
     * Initialize the SDK with a payment token
     * @param {string} token 
     */
    init: function (token) {
      this._token = token;
      return this;
    },

    /**
     * Fetch intent details (Amount, Merchant Name, UPI Link, QR Data)
     */
    getDetails: async function () {
      if (!this._token) throw new Error("WaveCollect: Token not initialized. Call .init(token) first.");
      try {
        const res = await fetch(`${this._config.baseUrl}/api/pay/details?token=${this._token}`);
        const json = await res.json();
        if (json.status !== "success") throw new Error(json.error || "Failed to fetch details");
        return json.data;
      } catch (e) {
        if (this._handlers.onError) this._handlers.onError(e);
        throw e;
      }
    },

    /**
     * Start polling for payment status
     */
    mount: function () {
      if (this._interval) clearInterval(this._interval);
      this._interval = setInterval(() => this._poll(), this._config.pollInterval);
      return this;
    },

    unmount: function () {
      if (this._interval) clearInterval(this._interval);
    },

    _poll: async function () {
      try {
        const res = await fetch(`${this._config.baseUrl}/api/pay/status?token=${this._token}&_t=${Date.now()}`);
        const json = await res.json();
        
        if (json.status === "success") {
          const status = json.data.payment_status;
          if (this._handlers.onStatusUpdate) this._handlers.onStatusUpdate(status);

          if (status === "SUCCESS") {
            this.unmount();
            if (this._handlers.onSuccess) this._handlers.onSuccess(json.data);
          } else if (status === "EXPIRED") {
            this.unmount();
            if (this._handlers.onExpire) this._handlers.onExpire();
          }
        }
      } catch (e) {
        console.error("WaveCollect Polling Error:", e);
      }
    },

    // Event Handlers
    onSuccess: function (cb) { this._handlers.onSuccess = cb; return this; },
    onExpire: function (cb) { this._handlers.onExpire = cb; return this; },
    onStatusUpdate: function (cb) { this._handlers.onStatusUpdate = cb; return this; },
    onError: function (cb) { this._handlers.onError = cb; return this; },
  };

  window.WaveCollect = WaveCollect;
})(window);
