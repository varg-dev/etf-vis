import * as d3 from 'd3';

// Ignore milliseconds, seconds, minutes.
const timeDiffIgnoreDivisor = 1000 * 60 * 60 * 24;

export const timestampIndexOfForecastArray = 0;
export const courseIndexOfForecastArray = 1;
export const numberOfMonthsOfAYear = 12;
export const inflationRate = 0.01;

export function isLastMonthOfAYear(date) {
    return date.getMonth() === numberOfMonthsOfAYear - 1;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

export function isStartOfTheYear(date) {
    return date.getMonth() === 0;
}

export function intervalIsEndOfYear(startDate, endDate) {
    return startDate.getFullYear() < endDate.getFullYear();
}

export function roundToMoneyAmount(amount) {
    return Math.round(amount * 100.0) / 100.0;
}

export async function loadHistoricalETFData(etfIdentifier, apiKey) {
    const historicalData = await d3.csv(
        `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${etfIdentifier}&apikey=${apiKey}&datatype=csv`,
        entry => {
            return {
                date: new Date(entry.timestamp.toString()),
                dividend: parseFloat(entry['dividend amount']),
                course: parseFloat(entry['adjusted close']),
            };
        }
    );
    historicalData.sort((a, b) => a.date - b.date);
    return historicalData;
}

export function etfHistoricalToCourseForecastArray(historicalData) {
    return historicalData.map(entry => [dateToTimestamp(entry.date), entry.course]);
}

// Requires sorted historical data. Note it is sorted by default. Do not change the order.
export function etfHistoricalToDividendForecastArray(historicalData) {
    let currentYear = historicalData[0].date.getFullYear();
    const dividendForecastArray = [[currentYear, 0]];
    historicalData.forEach(entry => {
        if (entry.date.getFullYear() === currentYear) {
            dividendForecastArray[dividendForecastArray.length - 1][courseIndexOfForecastArray] += entry.dividend;
        } else {
            currentYear = entry.date.getFullYear();
            dividendForecastArray.push([currentYear, entry.dividend]);
        }
    });
    dividendForecastArray.sort((a, b) => a[timestampIndexOfForecastArray] - b[timestampIndexOfForecastArray]);
    return dividendForecastArray;
}

export function dateToTimestamp(date) {
    return Math.floor(date.getTime() / timeDiffIgnoreDivisor);
}

export function timestampToDate(timestamp) {
    return new Date(timestamp * timeDiffIgnoreDivisor);
}

export default numberOfMonthsOfAYear;
