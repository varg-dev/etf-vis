import * as d3 from 'd3';

import { DataPoint } from 'regression';

// Ignore milliseconds, seconds, minutes.
const timeDiffIgnoreDivisor = 1000 * 60 * 60 * 24;

export const timestampIndexOfForecastArray = 0;
export const courseIndexOfForecastArray = 1;
export const numberOfMonthsOfAYear = 12;
export const inflationRate = 0.01;

export interface IHistoricEntry {
    date: Date;
    dividend: number;
    course: number;
}

export function isLastMonthOfAYear(date: Date) {
    return date.getMonth() === numberOfMonthsOfAYear - 1;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function isFirstMonthOfAYear(date: Date) {
    return date.getMonth() === 0;
}

export async function loadHistoricalETFData(etfIdentifier: string, apiKey: string): Promise<IHistoricEntry[]> {
    const historicalData = await d3.csv(
        `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${etfIdentifier}&apikey=${apiKey}&datatype=csv`,
        entry => {
            if (
                entry.timestamp === undefined ||
                entry['dividend amount'] === undefined ||
                entry['adjusted close'] === undefined
            ) {
                throw new Error(`The history of ${etfIdentifier} contained an undefined field.`);
            }
            return {
                date: new Date(entry.timestamp.toString()),
                dividend: parseFloat(entry['dividend amount']),
                course: parseFloat(entry['adjusted close']),
            };
        }
    );
    historicalData.sort((a, b) => a.date.valueOf() - b.date.valueOf());
    return historicalData;
}

export function etfHistoricalToCourseForecastArray(historicalData: IHistoricEntry[]): DataPoint[] {
    return historicalData.map(entry => [dateToTimestamp(entry.date), entry.course]);
}

// Requires sorted historical data. Note it is sorted by default. Do not change the order.
export function etfHistoricalToDividendForecastArray(historicalData: IHistoricEntry[]): DataPoint[] {
    let currentYear = historicalData[0].date.getFullYear();
    const dividendForecastArray: DataPoint[] = [[currentYear, 0]];
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

export function dateToTimestamp(date: Date) {
    return Math.floor(date.getTime() / timeDiffIgnoreDivisor);
}

export function timestampToDate(timestamp: number) {
    return new Date(timestamp * timeDiffIgnoreDivisor);
}

export function generateHistoricalDataNotPresentException(etfIdentifier: string) {
    return new Error(`First call loadHistoricalDataIfNotPresent() before predicting: ${etfIdentifier}`);
}

// Slightly manipulated. Original: https://stackoverflow.com/a/315767
function daysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
}

export function roundDateToBeginningOfMonth(date: Date) {
    const currentDayOfMonth = date.getDate();
    const maxDayOfMonth = daysInMonth(date.getMonth(), date.getFullYear());
    const monthOffset = Math.round(currentDayOfMonth / maxDayOfMonth);
    return new Date(date.getFullYear(), date.getMonth() + monthOffset);
}
