import regression from 'regression';
import { dateToInt, etfHistoricalToForecastArray, loadHistoricalETFData } from './utils';

const koerperschaftsteuerRatio = 0.25;
const solidaritaetszuschlagRatio = 0.055;

function splitKoerperschaftssteuer(brutto) {
    return [brutto * (1 - koerperschaftsteuerRatio), brutto * koerperschaftsteuerRatio];
}

function splitSolidaritaetszuschlag(brutto) {
    return [brutto * (1 - solidaritaetszuschlagRatio), brutto * solidaritaetszuschlagRatio];
}

export class ForecastModel {
    constructor(apiKey, backCastTimeFactor = 2) {
        this.historicalData = {};
        this.predictors = {};
        this.backCastTimeFactor = backCastTimeFactor;
        this.apiKey = apiKey;
    }

    async _loadHistoricalDataIfNotPresent(etfIdentifier) {
        if (etfIdentifier in this.historicalData) {
            return;
        }
        const historicalData = await loadHistoricalETFData(etfIdentifier);
        const forecastArray = etfHistoricalToForecastArray(historicalData);
        const firstTimestamp = forecastArray[0];
        const lastTimestamp = forecastArray[forecastArray.length - 1];
        const maxTimestampBeforePredictorRepetition = (lastTimestamp - firstTimestamp) / this.backCastTimeFactor;
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
        this.predictors[etfIdentifier][timestamp] = regression.linear(this.historicalData[etfIdentifier].forecastArray);
    }

    _dateToPredictorTimestampAndDateTimestamp(date) {
        const timestamp = dateToInt(date);
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
