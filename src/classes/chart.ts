import uniqid from 'uniqid';
import * as Highcharts from 'highcharts';

import { EventBus, CHART_CONFIG_UPDATED } from './../event-bus';

import { isPromise } from './../utils';

type SeriesData = (number | [number, number] | [string, number] | Highcharts.DataPoint)[] | undefined;

interface DVChartOptions {
    id?: string,
    config?: Highcharts.Options | Promise<Highcharts.Options>,
    data?: SeriesData | Promise<SeriesData>
};

class DVChart {
    readonly id: string;

    private _isConfigValid: boolean = false;

    private _config: Highcharts.Options | null = null;
    private _configPromise: Promise<Highcharts.Options> | null = null;
    private _data: SeriesData | null = null;
    private _dataPromise: Promise<SeriesData> | null = null;

    constructor({ id = uniqid.time(), config = null, data = null }: DVChartOptions = {}) {
        this.id = id;

        if (isPromise(config)) {
            this.setConfig(config);
        } else {
            this.config = config;
        }

        if (isPromise<SeriesData>(data)) {
            this.setData(data);
        } else  {
            this.data = data;
        }
    }

    set config(value: Highcharts.Options | null) {
        this._config = value;
        this._configPromise = null;

        this._validateConfig();
    }

    setConfig(value: Promise<Highcharts.Options>): void {
        this._configPromise = value;

        value.then(config => {
            if (value === this._configPromise) {
                this.config = config;
            }
        });
    }

    get config(): Highcharts.Options | null {
        return this._config;
    }

    set data(value: SeriesData | null) {
        this._data = value;
        this._dataPromise = null;

        this._validateConfig();
    }

    setData(value: Promise<SeriesData>): void {
        this._dataPromise = value;

        value.then(data => {
            if (value === this._dataPromise) {
                this.data = data;
            }
        });
    }

    get data(): SeriesData | null {
        return this._data;
    }

    update(): void {
        this._validateConfig();
    }

    private _validateConfig(): void {
        this._isConfigValid = false;

        if (!this.config) {
            return;
        }

        if (!this.config.series) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            console.log('series are missing for chart', this.id);

            return;
        }

        if (this.data) {
            if (this.data.length !== this.config.series.length) {
                // TODO: complain that series data supplied does not match chart config provided
                return;
            } else {
                // TODO: can we assume here that series data provided is of correct type
                this.data.forEach((seriesData, index) =>
                    (this.config!.series![index].data = seriesData as SeriesData));
            }
        }

        const isSeriesValid = this.config.series.some((series: Highcharts.IndividualSeriesOptions) =>
            typeof series.data !== 'undefined');

        if (!isSeriesValid) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            console.log('data is missing for chart', this.id);

            return;
        }

        console.log('chart ready', this.id);
        this._isConfigValid = true;
        EventBus.$emit(CHART_CONFIG_UPDATED, this);
    }

    get isConfigValid(): boolean {
        return this._isConfigValid;
    }
}

export {
    DVChart,
    DVChartOptions
}