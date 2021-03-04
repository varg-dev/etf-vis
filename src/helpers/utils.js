import * as d3 from 'd3';

// Ignore milliseconds, seconds, minutes.
const timeDiffIgnoreDivisor = 1000 * 60 * 60;

export async function loadHistoricalETFData(etfIdentifier, apiKey) {
    const historicalData = await d3.csv(
        `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${etfIdentifier}&apikey=${apiKey}&datatype=csv`,
        entry => {
            return {
                timestamp: new Date(entry.timestamp.toString()),
                dividend: parseFloat(entry['dividend amount']),
                course: parseFloat(entry['adjusted close']),
            };
        }
    );
    historicalData.sort((a, b) => b.timestamp - a.timestamp);
    return historicalData;
}

export function etfHistoricalToForecastArray(historicalData) {
    return historicalData.map(entry => [dateToInt(entry.timestamp), entry.course]);
}

export function dateToInt(date) {
    return Math.floor(date.getTime() / timeDiffIgnoreDivisor);
}
