import * as d3 from 'd3'

export class SizeScaleCalculator {
    constructor() {
        this.defaultRange = [3, 20]
    }

    getD3Scale(type) {
        const scaleMap = {
            linear: d3.scaleLinear(),
            log: d3.scaleLog(),
            pow: d3.scalePow(),
            sqrt: d3.scaleSqrt(),
            time: d3.scaleTime(),
            quantile: d3.scaleQuantile(),
            quantize: d3.scaleQuantize(),
            band: d3.scaleBand(),
            point: d3.scalePoint(),
        };
    
        const scaleFn = scaleMap[type.toLowerCase()];
        if (!scaleFn) {
            console.warn(`Unsupported scale type: ${type}. Using default.`);
            return scaleMap.linear
        }
        return scaleFn;
    }

    getScale({
        domain, range, type = "linear"
    }) {
        const isDomainValid = Array.isArray(domain) && domain.length > 0;
        
        // Domain validation
        if (!isDomainValid) {
            throw new Error(`Non-empty array expected for domain.`);
        }

        let validRange = range || this.defaultRange;

        let scale = this.getD3Scale(type)

        return scale.domain(d3.extent(domain)).range(validRange)
    }
}

export function getSizeScale({ domain, range, type = 'linear'}) {
    const calculator = new SizeScaleCalculator();
    return calculator.getScale({ domain, range, type });
}