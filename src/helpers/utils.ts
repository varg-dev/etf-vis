import * as d3 from 'd3';

import { DataPoint } from 'regression';

// Ignore milliseconds, seconds, minutes, hours.
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

/**
 * Converts the percentage to a float and return 0 in the case the number is NaN.
 *
 * @param value The concerning value.
 * @returns The value as a float.
 */
export function percentageToFloat(value: number) {
    return Number.isNaN(value) ? 0.0 : value / 100;
}

/**
 * Returns if the given value is a valid percentage.
 * Meaning that the value is between 0 and 100 and is not NaN.
 *
 * @param val The concerning value.
 * @returns If the value is a valid percentage.
 */
export function isPercentage(val: number): boolean {
    return !Number.isNaN(val) && val >= 0.0 && val <= 100.0;
}

/**
 * Returns if the given value is a valid integer.
 * Meaning that the value is an integer and is not NaN.
 *
 * @param val The concerning value.
 * @returns If the value is a valid integer.
 */
export function isPositiveInt(val: number): boolean {
    return !Number.isNaN(val) && Number.isInteger(val) && val >= 0;
}

/**
 * Checks if the date is the last month of a year i.e. December.
 *
 * @param date The date to check.
 * @returns Is the date in December.
 */
export function isLastMonthOfAYear(date: Date): boolean {
    return date.getMonth() === numberOfMonthsOfAYear - 1;
}

/**
 * Checks if the date is the first month of a year i.e. January.
 *
 * @param date The concerning date.
 * @returns Is the date in January.
 */
export function isFirstMonthOfAYear(date: Date): boolean {
    return date.getMonth() === 0;
}

/**
 * Clamps the given value into the given min-max range.
 *
 * @param value Value to clamp.
 * @param min Minimum value.
 * @param max Maximum value.
 * @returns
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

/**
 * Loads the historic data of the ETF by downloading and parsing it from the [Alphavantage](https://www.alphavantage.co/) API.
 *
 * @param etfIdentifier The ETF identifier (symbol) by [Alphavantage](https://www.alphavantage.co/).
 * @param apiKey The personal API [Alphavantage](https://www.alphavantage.co/) key.
 * @returns The sorted array with the historic entries.
 */
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

/**
 * Constructs a course forecasting array which consists of [Date, CourseValue] pairs.
 * The historical data needs to be sorted by the date. Which is already done when loading.
 *
 * @param historicalData The historical data array that should be used for the course forecasting array.
 * @returns The forecasting Array of [Date, CourseValue] pairs.
 */
export function etfHistoricalToCourseForecastArray(historicalData: IHistoricEntry[]): DataPoint[] {
    return historicalData.map(entry => [dateToTimestamp(entry.date), entry.course]);
}

/**
 * Constructs a dividend forecasting array which consists of [Year, DividendValue] pairs.
 * The historical data needs to be sorted by the date. Which is already done when loading.
 *
 * @param historicalData The historical data array that should be used for the course forecasting array.
 * @returns The forecasting Array of [Year, CourseValue] pairs.
 */
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

/**
 * Converts the date to a timestamp in the used format.
 * A timestamp is a unix timestamp which counts days instead of milliseconds.
 *
 * @param date The concerning Date.
 * @returns The corresponding timestamp.
 */
export function dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / timeDiffIgnoreDivisor);
}

/**
 * Converts the timestamp to a Date in the used format.
 * A timestamp is a unix timestamp which counts days instead of milliseconds.
 *
 * @param date The concerning timestamp.
 * @returns The corresponding Date.
 */
export function timestampToDate(timestamp: number): Date {
    return new Date(timestamp * timeDiffIgnoreDivisor);
}

/**
 * Generates a specific error for the given ETF identifier which is used to
 * indicate that the historic data needs to be loaded before forecasting for that etf is available.
 *
 * @param etfIdentifier The Identifier of the ETF.
 * @returns The error object.
 */
export function generateHistoricalDataNotPresentException(etfIdentifier: string): Error {
    return new Error(`First call loadHistoricalDataIfNotPresent() before predicting: ${etfIdentifier}`);
}

/**
 * Calculates the number of days in the given month and year.
 * Based on: https://stackoverflow.com/a/315767
 *
 * @param month The concerning Month.
 * @param year The concerning Year.
 * @returns The number of days of that month.
 */
function daysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Rounds the given date to the first day of that or the next month.
 *
 * @param date The concerning date.
 * @returns The rounded Date.
 */
export function roundDateToBeginningOfMonth(date: Date): Date {
    const currentDayOfMonth = date.getDate();
    const maxDayOfMonth = daysInMonth(date.getMonth(), date.getFullYear());
    const monthOffset = Math.round(currentDayOfMonth / maxDayOfMonth);
    return new Date(date.getFullYear(), date.getMonth() + monthOffset);
}
