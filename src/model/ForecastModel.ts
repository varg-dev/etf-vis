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

interface IETFProperty {
    identifier: string;
    symbol: string;
    label: string;
    percentage: number;
    selected: boolean;
}

interface IETFProperties {
    [etfIdentifier: string]: IETFProperty;
}

// USAGE: first call configure to set required static vars. Then the singleton can be accessed via getInstance. Never call the Constructor on your own.
// Always call loadAndCacheHistoricalETFData of an etf before calling predict on that etf.
export class ForecastModelSingleton {
    private static instance: null | ForecastModelSingleton = null;
    private static apiKey: string = '';
    private static backCastTimestampConstant: number = 7;
    private static backCastTimeFactor: number = 2;

    private historicalData: IHistoricData = {};
    private coursePredictors: IETFCoursePredictors = {};
    private dividendPredictors: IETFDividendPredictors = {};

    private constructor() {}

    static configure(apiKey: string, backCastTimeFactor = 2, backCastTimeConstant = 7) {
        ForecastModelSingleton.apiKey = apiKey;
        ForecastModelSingleton.backCastTimeFactor = backCastTimeFactor;

        const backCastTimeDate = new Date(0);
        backCastTimeDate.setMonth(backCastTimeConstant);
        ForecastModelSingleton.backCastTimestampConstant = dateToTimestamp(backCastTimeDate);

        // reset predictors if present.
        if (ForecastModelSingleton.instance != null) {
            const instance = ForecastModelSingleton.getInstance();
            for (const etfIdentifier in instance.coursePredictors) {
                instance.coursePredictors[
                    etfIdentifier
                ].maxTimestampBeforeCoursePredictorRepetition = ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
                    instance.historicalData[etfIdentifier].courseForecastArray
                );
            }
            for (const etfIdentifier in instance.dividendPredictors) {
                instance.dividendPredictors[
                    etfIdentifier
                ].maxYearBeforeDividendPredictorRepetition = ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
                    instance.historicalData[etfIdentifier].dividendForecastArray
                );
            }
        }
    }

    static async loadHistoricData(apiKey: string, etfProperties: IETFProperties) {
        ForecastModelSingleton.configure(apiKey);
        const forecast = ForecastModelSingleton.getInstance();
        for (const etfIdentifier in etfProperties) {
            await forecast._loadAndCacheHistoricalETFData(etfProperties[etfIdentifier].symbol);
        }
        console.log('Finished loading the historic data.');
    }

    static getInstance() {
        if (ForecastModelSingleton.instance == null) {
            ForecastModelSingleton.instance = new ForecastModelSingleton();
        }
        return ForecastModelSingleton.instance;
    }

    private static _calculateMaxTimestampBeforePredictorRepetition(forecastArray: DataPoint[]) {
        const firstTimestamp = forecastArray[0][timestampIndexOfForecastArray];
        const lastTimestamp = forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray];
        return lastTimestamp + (lastTimestamp - firstTimestamp) / ForecastModelSingleton.backCastTimeFactor;
    }

    private async _loadAndCacheHistoricalETFData(etfIdentifier: string) {
        if (etfIdentifier in this.historicalData) {
            return;
        }
        const historicalData = await loadHistoricalETFData(etfIdentifier, ForecastModelSingleton.apiKey);

        const courseForecastArray = etfHistoricalToCourseForecastArray(historicalData);
        const maxTimestampBeforeCoursePredictorRepetition = ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
            courseForecastArray
        );

        const dividendForecastArray = etfHistoricalToDividendForecastArray(historicalData);
        const maxYearBeforeDividendPredictorRepetition = ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
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

    private _courseDateToPredictorTimestampAndDateTimestamp(date: Date, etfIdentifier: string) {
        const timestamp = dateToTimestamp(date);
        return [
            timestamp > this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                ? this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                : timestamp,
            timestamp,
        ];
    }

    private _createDividendPredictorIfNotPresent(etfIdentifier: string, year: number) {
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

    private _dividendYearToPredictorYear(etfIdentifier: string, year: number) {
        return this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition < year
            ? this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition
            : year;
    }

    predictCourse(etfIdentifier: string, date: Date) {
        if (!(etfIdentifier in this.coursePredictors)) {
            throw generateHistoricalDataNotPresentException(etfIdentifier);
        }
        const [predictorTimestamp, timestamp] = this._courseDateToPredictorTimestampAndDateTimestamp(
            date,
            etfIdentifier
        );
        this._createCoursePredictorIfNotPresent(etfIdentifier, predictorTimestamp);
        return this.coursePredictors[etfIdentifier].predictors[predictorTimestamp].predict(timestamp)[
            courseIndexOfForecastArray
        ];
    }

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
