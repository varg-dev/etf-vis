import regression from 'regression';
import { dateToTimestamp, etfHistoricalToForecastArray, loadHistoricalETFData, timestampToDate } from './utils';

const koerperschaftsteuerRatio = 0.25;
const solidaritaetszuschlagRatio = 0.055;

function splitKoerperschaftssteuer(brutto) {
    return [brutto * (1 - koerperschaftsteuerRatio), brutto * koerperschaftsteuerRatio];
}

function splitSolidaritaetszuschlag(brutto) {
    return [brutto * (1 - solidaritaetszuschlagRatio), brutto * solidaritaetszuschlagRatio];
}

export class ForecastModel {
    constructor(apiKey, backCastTimeFactor = 2, backCastTimeConstant = 7) {
        this.historicalData = {};
        this.predictors = {};
        this.backCastTimeFactor = backCastTimeFactor;
        this.apiKey = apiKey;
        const backCastTimeDate = new Date(0);
        backCastTimeDate.setMonth(backCastTimeConstant);
        this.backCastTimestampConstant = dateToTimestamp(backCastTimeDate);
    }

    async _loadHistoricalDataIfNotPresent(etfIdentifier) {
        if (etfIdentifier in this.historicalData) {
            return;
        }
        const historicalData = await loadHistoricalETFData(etfIdentifier);
        const forecastArray = etfHistoricalToForecastArray(historicalData);
        const firstTimestamp = forecastArray[0][0];
        const lastTimestamp = forecastArray[forecastArray.length - 1][0];
        const maxTimestampBeforePredictorRepetition = lastTimestamp + (lastTimestamp - firstTimestamp) / this.backCastTimeFactor;
        this.historicalData[etfIdentifier] = {
            history: historicalData,
            forecastArray: forecastArray,
            maxTimestampBeforePredictorRepetition: maxTimestampBeforePredictorRepetition,
        };
    }

    _createPredictorIfNotPresent(etfIdentifier, timestamp) {
        if (!(etfIdentifier in this.predictors)) {
            this.predictors[etfIdentifier] = {};
        }
        // Skip if already exists.
        if (timestamp in this.predictors[etfIdentifier]) {
            return;
        }
        const forecastArray = this.historicalData[etfIdentifier].forecastArray;
        const lastTimestampToIncludeInPrediction =
            forecastArray[forecastArray.length - 1][0] -
            Math.abs(forecastArray[forecastArray.length - 1][0] - timestamp) * this.backCastTimeFactor -
            this.backCastTimestampConstant;
        const filteredForecastArray = forecastArray.filter(entry => entry[0] >= lastTimestampToIncludeInPrediction);
        this.predictors[etfIdentifier][timestamp] = regression.linear(filteredForecastArray);
    }

    _dateToPredictorTimestampAndDateTimestamp(date) {
        const timestamp = dateToTimestamp(date);
        return [
            timestamp > this.maxTimestampBeforePredictorRepetition
                ? this.maxTimestampBeforePredictorRepetition
                : timestamp,
            timestamp,
        ];
    }

    async predict(etfIdentifier, date) {
        await this._loadHistoricalDataIfNotPresent(etfIdentifier, this.apiKey);
        const [predictorTimestamp, timestamp] = this._dateToPredictorTimestampAndDateTimestamp(date);
        this._createPredictorIfNotPresent(etfIdentifier, predictorTimestamp);
        return this.predictors[etfIdentifier][predictorTimestamp].predict(timestamp);
    }
}

export default ForecastModel;
