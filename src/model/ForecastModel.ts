import regression from 'regression';
import { DataPoint } from 'regression';
import {
    dateToTimestamp,
    etfHistoricalToCourseForecastArray,
    etfHistoricalToDividendForecastArray,
    loadHistoricalETFData,
    timestampIndexOfForecastArray,
    courseIndexOfForecastArray,
    generateHistoricalDataNotPresentException,
    IHistoricEntry,
} from '../helpers/utils';

interface IDividendPredictor {
    [timestamp: number]: regression.Result;
}

interface IDividendPredictors {
    maxYearBeforeDividendPredictorRepetition: number;
    predictors: IDividendPredictor;
}

interface ICoursePredictors {
    maxTimestampBeforeCoursePredictorRepetition: number;
    predictors: ICoursePredictor;
}

interface ICoursePredictor {
    [timestamp: number]: regression.Result;
}

interface IETFCoursePredictors {
    [etfIdentifier: string]: ICoursePredictors;
}

interface IETFDividendPredictors {
    [etfIdentifier: string]: IDividendPredictors;
}

interface IHistoricData {
    [etfIdentifier: string]: IHistoricDataOfETF;
}

interface IHistoricDataOfETF {
    courseForecastArray: DataPoint[];
    dividendForecastArray: DataPoint[];
    history: IHistoricEntry[];
}

export type ETFIdentifier = 'SP5C.PAR' | 'ESGE' | 'SUSA';

export interface IETFProperty {
    identifier: string;
    symbol: ETFIdentifier;
    label: string;
    value: number;
    selected: boolean;
}

interface IETFProperties {
    [etfIdentifier: string]: IETFProperty;
}

/**
 * Singleton class that provided course and dividend forecasting of ETFs.
 * It uses [Alphavantage](https://www.alphavantage.co/) to load historic data which
 * are used by a linear regression model for forecasting.
 * The father the forecast day is in the future the more historic data is used to fit the linear regression.
 * The historic data needs to be loaded before a forecast can be done.
 * Dividends are accumulated and predicted per year.
 *
 * Example Code:
 * ```typescript
 * await ForecastModelSingleton.loadHistoricData(apiKey, etfProperties);
 * const instance = ForecastModelSingleton.getInstance();
 * const predictedCourse = instance.predictCourse(etfIdentifier, futureDate);
 * const predictedDividend = instance.predictCourse(etfIdentifier, futureYear);
 * ```
 */
export class ForecastModelSingleton {
    private static instance: null | ForecastModelSingleton = null;
    private static apiKey: string = '';
    private static backCastTimestampConstant: number = 7;
    private static backCastTimeFactor: number = 2;

    private historicalData: IHistoricData = {};
    private coursePredictors: IETFCoursePredictors = {};
    private dividendPredictors: IETFDividendPredictors = {};

    private constructor() {}

    /**
     * Configures the forecasting by setting the concerning values and resetting the present predictors.
     *
     * @param apiKey The [Alphavantage](https://www.alphavantage.co/) API Key.
     * @param backCastTimeFactor Linear forecast factor. The number of dates used for prediction is increase linear towards this factor.
     * @param backCastTimeConstant Constant forecast Offset. Constantly increases the number of dates used for prediction.
     */
    static configure(apiKey: string, backCastTimeFactor = 2, backCastTimeConstant = 7): void {
        ForecastModelSingleton.apiKey = apiKey;
        ForecastModelSingleton.backCastTimeFactor = backCastTimeFactor;

        const backCastTimeDate = new Date(0);
        backCastTimeDate.setMonth(backCastTimeConstant);
        ForecastModelSingleton.backCastTimestampConstant = dateToTimestamp(backCastTimeDate);

        // Reset predictors if present.
        if (ForecastModelSingleton.instance != null) {
            const instance = ForecastModelSingleton.getInstance();
            for (const etfIdentifier in instance.coursePredictors) {
                instance.coursePredictors[
                    etfIdentifier
                ].maxTimestampBeforeCoursePredictorRepetition = ForecastModelSingleton._calculateTimestampForPredictorRepetition(
                    instance.historicalData[etfIdentifier].courseForecastArray
                );
            }
            for (const etfIdentifier in instance.dividendPredictors) {
                instance.dividendPredictors[
                    etfIdentifier
                ].maxYearBeforeDividendPredictorRepetition = ForecastModelSingleton._calculateTimestampForPredictorRepetition(
                    instance.historicalData[etfIdentifier].dividendForecastArray
                );
            }
        }
    }

    /**
     * Configures the Forecasting with the api key and default forecast values.
     * Loads the historic data from all ETFs in the etfProperties.
     *
     * @param apiKey The [Alphavantage](https://www.alphavantage.co/) API Key.
     * @param etfProperties The etfProperties.
     */
    static async loadHistoricData(apiKey: string, etfProperties: IETFProperties): Promise<void> {
        ForecastModelSingleton.configure(apiKey);
        const forecast = ForecastModelSingleton.getInstance();
        for (const etfIdentifier in etfProperties) {
            await forecast._loadAndCacheHistoricalETFData(etfProperties[etfIdentifier].symbol);
        }
        console.log('Finished loading the historic data.');
    }

    /**
     * Returns the Singleton instance of this class.
     *
     * @returns The singleton instance.
     */
    static getInstance(): ForecastModelSingleton {
        if (ForecastModelSingleton.instance == null) {
            ForecastModelSingleton.instance = new ForecastModelSingleton();
        }
        return ForecastModelSingleton.instance;
    }

    /**
     * Calculates the timestamp at which point all predictors are the same since they use all data points.
     *
     * @param forecastArray The concerning forecast array.
     * @returns The timestamp where the repetition starts.
     */
    private static _calculateTimestampForPredictorRepetition(forecastArray: DataPoint[]): number {
        const firstTimestamp = forecastArray[0][timestampIndexOfForecastArray];
        const lastTimestamp = forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray];
        return lastTimestamp + (lastTimestamp - firstTimestamp) / ForecastModelSingleton.backCastTimeFactor;
    }

    /**
     * Loads the historic data for the provided etfIdentifier and sets up the predictors.
     *
     * @param etfIdentifier The concerning ETFIdentifier.
     * @returns -
     */
    private async _loadAndCacheHistoricalETFData(etfIdentifier: string): Promise<void> {
        if (etfIdentifier in this.historicalData) {
            return;
        }
        const historicalData = await loadHistoricalETFData(etfIdentifier, ForecastModelSingleton.apiKey);

        const courseForecastArray = etfHistoricalToCourseForecastArray(historicalData);
        const maxTimestampBeforeCoursePredictorRepetition = ForecastModelSingleton._calculateTimestampForPredictorRepetition(
            courseForecastArray
        );

        const dividendForecastArray = etfHistoricalToDividendForecastArray(historicalData);
        const maxYearBeforeDividendPredictorRepetition = ForecastModelSingleton._calculateTimestampForPredictorRepetition(
            dividendForecastArray
        );

        this.historicalData[etfIdentifier] = {
            history: historicalData,
            courseForecastArray: courseForecastArray,
            dividendForecastArray: dividendForecastArray,
        };
        this.coursePredictors[etfIdentifier] = {
            maxTimestampBeforeCoursePredictorRepetition: maxTimestampBeforeCoursePredictorRepetition,
            predictors: {},
        };
        this.dividendPredictors[etfIdentifier] = {
            maxYearBeforeDividendPredictorRepetition: maxYearBeforeDividendPredictorRepetition,
            predictors: {},
        };
    }

    /**
     * Creates the course predictor for the etfIdentifier and the given timestamp if not already present.
     *
     * @param etfIdentifier The concerning etfIdentifier.
     * @param timestamp The concerning timestamp.
     * @returns
     */
    private _createCoursePredictorIfNotPresent(etfIdentifier: string, timestamp: number) {
        // Skip if already exists.
        if (timestamp in this.coursePredictors[etfIdentifier]) {
            return;
        }
        const forecastArray = this.historicalData[etfIdentifier].courseForecastArray;
        const lastTimestampToIncludeInPrediction =
            forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray] -
            Math.abs(forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray] - timestamp) *
                ForecastModelSingleton.backCastTimeFactor -
            ForecastModelSingleton.backCastTimestampConstant;
        const filteredForecastArray = forecastArray.filter(
            entry => entry[timestampIndexOfForecastArray] >= lastTimestampToIncludeInPrediction
        );
        this.coursePredictors[etfIdentifier].predictors[timestamp] = regression.linear(filteredForecastArray, {
            order: 2,
            precision: 20,
        });
    }

    /**
     * Calculates the timestamp of the given date and the timestamp that should be used for the predictor.
     * That means that the predictor timestamp is clamped to the timestamp where the predictor already uses all data points.
     *
     * @param date The concerning Date.
     * @param etfIdentifier The concerning etfIdentifier.
     * @returns The predictor timestamp and date timestamp.
     */
    private _courseDateToPredictorTimestampAndDateTimestamp(date: Date, etfIdentifier: string): [number, number] {
        const timestamp = dateToTimestamp(date);
        return [
            timestamp > this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                ? this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                : timestamp,
            timestamp,
        ];
    }

    /**
     * Creates the dividend predictor for the given etf and the year.
     *
     * @param etfIdentifier The concerning etfIdentifier.
     * @param year The concerning year.
     */
    private _createDividendPredictorIfNotPresent(etfIdentifier: string, year: number): void {
        // Skip if already exists.
        if (year in this.dividendPredictors[etfIdentifier]) {
            return;
        }
        const forecastArray = this.historicalData[etfIdentifier].dividendForecastArray;
        const lastYearToIncludeInPrediction =
            forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray] -
            Math.abs(forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray] - year) *
                ForecastModelSingleton.backCastTimeFactor -
            ForecastModelSingleton.backCastTimestampConstant;
        const filteredForecastArray = forecastArray.filter(
            entry => entry[timestampIndexOfForecastArray] >= lastYearToIncludeInPrediction
        );
        this.dividendPredictors[etfIdentifier].predictors[year] = regression.linear(filteredForecastArray, {
            order: 2,
            precision: 20,
        });
    }

    /**
     * Clamps the given year to the year when all predictors would be the same
     *  since all historic data of the given etf is already used.
     *
     * @param etfIdentifier The concerning etfIdentifier.
     * @param year The concerning year.
     * @returns The adjusted year.
     */
    private _dividendYearToPredictorYear(etfIdentifier: string, year: number): number {
        return this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition < year
            ? this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition
            : year;
    }

    /**
     * Predicts the course of the given ETF at the given date with the specified confidence.
     *
     * @param etfIdentifier The concerning etfIdentifier
     * @param date The concerning date.
     * @param confidence The confidence of the price development.
     * @param startDate The startDate of the prediction.
     * @returns The predicted course of the etf.
     */
    predictCourse(etfIdentifier: string, date: Date, confidence: number, startDate: Date) {
        if (!(etfIdentifier in this.coursePredictors)) {
            throw generateHistoricalDataNotPresentException(etfIdentifier);
        }
        const [predictorTimestamp, timestamp] = this._courseDateToPredictorTimestampAndDateTimestamp(
            date,
            etfIdentifier
        );
        const startingTimestamp = dateToTimestamp(startDate);
        this._createCoursePredictorIfNotPresent(etfIdentifier, predictorTimestamp);
        const eq = this.coursePredictors[etfIdentifier].predictors[predictorTimestamp].equation;
        // Transforms the percentage [0,100] to the interval [1.5, 0.5].
        const confidenceFactor = (1 - confidence - 0.5) * 2 * 0.5 + 1;
        const startingPrice = eq[0] * startingTimestamp + eq[1];
        const adjustedConfidencePrice = eq[0] * confidenceFactor * (timestamp - startingTimestamp) + startingPrice;
        return adjustedConfidencePrice;
    }

    /**
     * Predicts the dividend amount of the given ETF at the given year.
     *
     * @param etfIdentifier The concerning etfIdentifier.
     * @param year The concerning year.
     * @returns The predicted dividend amount of the etf.
     */
    predictDividend(etfIdentifier: string, year: number) {
        if (!(etfIdentifier in this.dividendPredictors)) {
            throw generateHistoricalDataNotPresentException(etfIdentifier);
        }
        const predictorYear = this._dividendYearToPredictorYear(etfIdentifier, year);
        this._createDividendPredictorIfNotPresent(etfIdentifier, predictorYear);
        return Math.max(
            0,
            this.dividendPredictors[etfIdentifier].predictors[predictorYear].predict(year)[courseIndexOfForecastArray]
        );
    }
}
