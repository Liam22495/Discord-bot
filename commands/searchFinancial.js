// searchFinancial.js
const axios = require('axios');
require('dotenv').config();

module.exports = {
    name: 'search',
    description: 'Search for cryptocurrency or stock statistics',
    options: [
        {
            name: 'type',
            type: 3,
            description: 'The type of financial data (crypto or stock)',
            required: true,
            choices: [
                { name: 'Crypto', value: 'crypto' },
                { name: 'Stock', value: 'stock' }
            ],
        },
        {
            name: 'symbol',
            type: 3,
            description: 'The symbol of the cryptocurrency or stock',
            required: true,
        },
    ],
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const symbol = interaction.options.getString('symbol').toUpperCase();

        try {
            let formattedResponse = "";

            if (type === 'crypto') {
                const cryptoResponse = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`, {
                    params: { symbol: symbol },
                    headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY }
                });

                if (cryptoResponse.data.data && cryptoResponse.data.data[symbol]) {
                    const cryptoData = cryptoResponse.data.data[symbol].quote.USD;

                    // Format the response with additional details
                    formattedResponse = `Crypto: ${symbol}\n` +
                                        `Price: $${cryptoData.price ? cryptoData.price.toFixed(2) : 'N/A'}\n` +
                                        `Change (1h): ${cryptoData.percent_change_1h ? cryptoData.percent_change_1h.toFixed(2) : 'N/A'}%\n` +
                                        `Change (24h): ${cryptoData.percent_change_24h ? cryptoData.percent_change_24h.toFixed(2) : 'N/A'}%\n` +
                                        `Change (7d): ${cryptoData.percent_change_7d ? cryptoData.percent_change_7d.toFixed(2) : 'N/A'}%\n` +
                                        `Market Cap: $${cryptoData.market_cap ? cryptoData.market_cap.toFixed(2) : 'N/A'}\n` +
                                        `Volume (24h): $${cryptoData.volume_24h ? cryptoData.volume_24h.toFixed(2) : 'N/A'}\n`;
                } else {
                    formattedResponse = `No data found for symbol: ${symbol}`;
                }
            } else if (type === 'stock') {
                // Placeholder for stock data API call
            }

            await interaction.reply({ content: formattedResponse });
        } catch (error) {
            console.error('Error fetching financial data:', error);
            await interaction.reply({ content: 'There was an error while fetching the data.' });
        }
    },
};