import { ISwarmData, ISwarmDataElement } from "../interfaces/chart.interfaces";

export class SwarmHelper {
    data: ISwarmData = { title: '', unit: '', data: [] };

    setData(
        data: any,
        title: string,
        category: string,
        id: string,
        label: string,
        value: string,
        group: string,
        unit: string,
        decimals?: number
    ) {
        let rounding: (value: number) => number

        if (decimals === undefined) {
            rounding = (value: number) => value
        } else {
            const factor = Math.pow(10, decimals)
            rounding = (value: number) => Math.round(value * factor) / factor
        }

        const elements: ISwarmDataElement[] = data.map((item: any) => ({
            id: item[id],
            label: item[label],
            value: rounding(item[value]),
            category: item[category],
            group: item[group]
        }))

        this.data = {
            title,
            unit,
            data: elements
        }
    }
}