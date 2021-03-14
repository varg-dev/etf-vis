import regression from 'regression';
import {
    dateToTimestamp,
    etfHistoricalToCourseForecastArray,
    etfHistoricalToDividendForecastArray,
    loadHistoricalETFData,
    timestampToDate,
    timestampIndexOfForecastArray,
    courseIndexOfForecastArray,
} from '../helpers/utils';

// USAGE: first call configure to set required static vars. Then the singleton can be accessed via getInstance. Never call the Constructor on your own.
// Always call loadAndCacheHistoricalETFData of an etf before calling predict on that etf.
export class ForecastModelSingleton {
    static instance = null;
    static apiKey = null;
    static backCastTimeConstant = null;
    static backCastTimeFactor = null;

    // DO NOT CALL. USE getInstance()
    constructor() {
        this.historicalData = {};
        this.coursePredictors = {};
        this.dividendPredictors = {};
    }

    static configure(apiKey, backCastTimeFactor = 2, backCastTimeConstant = 7) {
        ForecastModelSingleton.apiKey = apiKey;
        ForecastModelSingleton.backCastTimeFactor = backCastTimeFactor;

        const backCastTimeDate = new Date(0);
        backCastTimeDate.setMonth(backCastTimeConstant);
        ForecastModelSingleton.backCastTimestampConstant = dateToTimestamp(backCastTimeDate);

        // reset predictors if present.
        if (ForecastModelSingleton.instance != null) {
            const instance = ForecastModelSingleton.getInstance();
            for (const etfIdentifier in instance.coursePredictors) {
                instance.coursePredictors[etfIdentifier] = {
                    maxTimestampBeforeCoursePredictorRepetition: ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
                        instance.historicalData[etfIdentifier].courseForecastArray
                    ),
                };
            }
            for (const etfIdentifier in instance.dividendPredictors) {
                instance.dividendPredictors[etfIdentifier] = {
                    maxYearBeforeDividendPredictorRepetition: ForecastModelSingleton._calculateMaxTimestampBeforePredictorRepetition(
                        instance.historicalData[etfIdentifier].dividendForecastArray
                    ),
                };
            }
        }
    }

    static getInstance() {
        if (ForecastModelSingleton.instance == null) {
            ForecastModelSingleton.instance = new ForecastModelSingleton();
        }
        return ForecastModelSingleton.instance;
    }

    static _calculateMaxTimestampBeforePredictorRepetition(forecastArray) {
        const firstTimestamp = forecastArray[0][timestampIndexOfForecastArray];
        const lastTimestamp = forecastArray[forecastArray.length - 1][timestampIndexOfForecastArray];
        return lastTimestamp + (lastTimestamp - firstTimestamp) / ForecastModelSingleton.backCastTimeFactor;
    }

    async loadAndCacheHistoricalETFData(etfIdentifier) {
        if (etfIdentifier in this.historicalData) {
            return;
        }
        const historicalData = await loadHistoricalETFData(etfIdentifier);

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
        };
        this.dividendPredictors[etfIdentifier] = {
            maxYearBeforeDividendPredictorRepetition: maxYearBeforeDividendPredictorRepetition,
        };
    }

    _createCoursePredictorIfNotPresent(etfIdentifier, timestamp) {
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
        this.coursePredictors[etfIdentifier][timestamp] = regression.linear(filteredForecastArray);
    }

    _courseDateToPredictorTimestampAndDateTimestamp(date, etfIdentifier) {
        const timestamp = dateToTimestamp(date);
        return [
            timestamp > this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                ? this.coursePredictors[etfIdentifier].maxTimestampBeforeCoursePredictorRepetition
                : timestamp,
            timestamp,
        ];
    }

    _createDividendPredictorIfNotPresent(etfIdentifier, year) {
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
        this.dividendPredictors[etfIdentifier][year] = regression.linear(filteredForecastArray);
    }

    _dividendYearToPredictorYear(etfIdentifier, year) {
        return this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition < year
            ? this.dividendPredictors[etfIdentifier].maxYearBeforeDividendPredictorRepetition
            : year;
    }

    predictCourse(etfIdentifier, date) {
        if (!(etfIdentifier in this.coursePredictors)) {
            throw 'First call loadHistoricalDataIfNotPresent() before predicting';
        }
        const [predictorTimestamp, timestamp] = this._courseDateToPredictorTimestampAndDateTimestamp(
            date,
            etfIdentifier
        );
        this._createCoursePredictorIfNotPresent(etfIdentifier, predictorTimestamp);
        return this.coursePredictors[etfIdentifier][predictorTimestamp].predict(timestamp)[courseIndexOfForecastArray];
    }

    predictDividend(etfIdentifier, year) {
        if (!(etfIdentifier in this.dividendPredictors)) {
            throw 'First call loadHistoricalDataIfNotPresent() before predicting';
        }
        const predictorYear = this._dividendYearToPredictorYear(etfIdentifier, year);
        this._createDividendPredictorIfNotPresent(etfIdentifier, predictorYear);
        return Math.max(0, this.dividendPredictors[etfIdentifier][predictorYear].predict(year)[courseIndexOfForecastArray]);
    }
}

export default ForecastModelSingleton;
