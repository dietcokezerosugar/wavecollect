import axios from "axios";
import { logApi } from "@/lib/log";

export class TelegramService {
  /**
   * Send a message via Telegram Bot API
   */
  static async sendMessage(botToken: string, chatId: string, text: string) {
    if (!botToken || !chatId) return;

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      });
      console.log(`[TelegramService] Message sent to ${chatId}`);
    } catch (error: any) {
      await logApi("ERROR", "Telegram notification failed", undefined, {
        chatId,
        error: error.response?.data || error.message,
      });
      console.error("[TelegramService] Error:", error.response?.data || error.message);
    }
  }

  /**
   * Notify merchant about bot status changes
   */
  static async notifyBotStatus(
    merchant: { telegramBotToken?: string | null; telegramChatId?: string | null },
    botName: string,
    status: string
  ) {
    if (!merchant.telegramBotToken || !merchant.telegramChatId) return;

    const icon = status === "ACTIVE" ? "✅" : "⚠️";
    const message = `${icon} <b>Bot Status Update</b>\n\n` +
      `<b>Bot:</b> ${botName}\n` +
      `<b>Status:</b> ${status}\n\n` +
      `<i>Please check your dashboard if action is required.</i>`;

    await this.sendMessage(merchant.telegramBotToken, merchant.telegramChatId, message);
  }

  /**
   * Notify about large manual approvals
   */
  static async notifyManualApproval(
    merchant: { telegramBotToken?: string | null; telegramChatId?: string | null },
    amount: number,
    referenceId: string
  ) {
    if (!merchant.telegramBotToken || !merchant.telegramChatId) return;

    const message = `🛠 <b>Manual Approval Alert</b>\n\n` +
      `<b>Amount:</b> ₹${amount.toLocaleString()}\n` +
      `<b>Ref:</b> ${referenceId}\n\n` +
      `<i>This transaction was manually verified by the merchant.</i>`;

    await this.sendMessage(merchant.telegramBotToken, merchant.telegramChatId, message);
  }
}
