const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const bot = new TelegramBot('6901784883:AAG8VXHrJ1BHwKAfMI0fgJE7tIy4hoen28k', { polling: true });
const apiKey = 'c58cf05b-fde1-4899-82e7-decd56f8d732';
const currentPriceUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

let prices = {
  oneMinuteAgo: null,
  fiveMinutesAgo: null,
  fifteenMinutesAgo: null,
  oneHourAgo: null,
  twoHoursAgo: null,
  threeHoursAgo: null,
  twelveHoursAgo: null,
  twentyFourHoursAgo: null
};

// Store the start time
const startTime = Date.now();

// Function to get the current price of Ethereum
async function getCurrentEthereumPrice() {
  try {
    const response = await axios.get(currentPriceUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey
      },
      params: {
        'symbol': 'ETH'
      }
    });
    const currentPrice = response.data.data.ETH.quote.USD.price;
    return currentPrice;
  } catch (error) {
    console.error('Error fetching the current Ethereum price:', error);
  }
}

// Function to send an alert to Telegram
function sendTelegramAlert(message) {
  // Replace 'YOUR_CHAT_ID' with your actual chat ID
  bot.sendMessage('-1002177242079', message).catch(error => {
    console.error('Error sending message:', error.response.body);
  });
}

// Function to update the stored prices
function updatePrices(currentPrice) {
  prices.twentyFourHoursAgo = prices.twelveHoursAgo;
  prices.twelveHoursAgo = prices.threeHoursAgo;
  prices.threeHoursAgo = prices.twoHoursAgo;
  prices.twoHoursAgo = prices.oneHourAgo;
  prices.oneHourAgo = prices.fifteenMinutesAgo;
  prices.fifteenMinutesAgo = prices.fiveMinutesAgo;
  prices.fiveMinutesAgo = prices.oneMinuteAgo;
  prices.oneMinuteAgo = currentPrice;
}

// Function to calculate percentage change
function calculatePercentageChange(newPrice, oldPrice) {
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

// Function to format the elapsed time
function getElapsedTime() {
  const milliseconds = Date.now() - startTime;
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours} hours, ${minutes % 60} minutes, ${seconds % 60} seconds`;
}

// Main monitoring function
async function monitorPrice() {
  const currentPrice = await getCurrentEthereumPrice();
  updatePrices(currentPrice); // Update prices first to include the latest price

  if (prices.oneMinuteAgo !== null) {
    const oneMinuteChange = calculatePercentageChange(currentPrice, prices.oneMinuteAgo);
    const fiveMinuteChange = calculatePercentageChange(currentPrice, prices.fiveMinutesAgo);
    const fifteenMinuteChange = calculatePercentageChange(currentPrice, prices.fifteenMinutesAgo);
    const oneHourChange = calculatePercentageChange(currentPrice, prices.oneHourAgo);
    const twoHourChange = calculatePercentageChange(currentPrice, prices.twoHoursAgo);
    const threeHourChange = calculatePercentageChange(currentPrice, prices.threeHoursAgo);
    const twelveHourChange = calculatePercentageChange(currentPrice, prices.twelveHoursAgo);
    const twentyFourHourChange = calculatePercentageChange(currentPrice, prices.twentyFourHoursAgo);
    const elapsedTime = getElapsedTime(); // Get the elapsed time

    // Combine all information into one message
    const message = `Current Ethereum price: $${currentPrice}\n` +
                    `Price change over the last minute: ${oneMinuteChange.toFixed(2)}%\n` +
                    `Price change over the last 5 minutes: ${fiveMinuteChange.toFixed(2)}%\n` +
                    `Price change over the last 15 minutes: ${fifteenMinuteChange.toFixed(2)}%\n` +
                    `Price change over the last hour: ${oneHourChange.toFixed(2)}%\n` +
                    `Price change over the last 2 hours: ${twoHourChange.toFixed(2)}%\n` +
                    `Price change over the last 3 hours: ${threeHourChange.toFixed(2)}%\n` +
                    `Price change over the last 12 hours: ${twelveHourChange.toFixed(2)}%\n` +
                    `Price change over the last 24 hours: ${twentyFourHourChange.toFixed(2)}%\n` +
                    `Code has been running for: ${elapsedTime}`;

    sendTelegramAlert(message); // Send the combined message
  }
}

// Schedule to send alerts every thirty seconds
setInterval(monitorPrice, 3000);
