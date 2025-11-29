const TELEGRAM_BOT_TOKEN = '7991516405:AAF7TsAryTxguOTg4CNm8E_trlIzQDZjVTA';
const TELEGRAM_CHAT_ID = '-4898281592';

async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
    }
    return data;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendTelegramMessage };
}
