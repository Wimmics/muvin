import * as d3 from 'd3'

export class DomainCalculator{
    constructor() {

    }

    getDomain({
        dimension,
        sparqlResults,
        dataField,
        givenDomain
    }) {
        if (!dataField && dimension == 'size'){
            console.warn(`Encoding is missing for size field. Using default.`)
            return
        }

        if (dataField && !sparqlResults.head.vars.includes(dataField)) {
            throw new Error(`[${dimension} domain] Invalid field name: ${dataField}.`)
        }
        
        const bindings = sparqlResults.results.bindings
        
        // unique values of the given field in the data
        let domainValues = bindings.map(d => d[dataField].value)
        domainValues = [... new Set(domainValues)]
        domainValues.sort()
        
        if (givenDomain) {
            givenDomain = givenDomain.filter(d => domainValues.includes(d)) // Filter out invalid domain values
    
            const setsAreEqual =
                domainValues.length === givenDomain.length &&
                domainValues.every(val => givenDomain.includes(val)) &&
                givenDomain.every(val => domainValues.includes(val));
            
            if (!setsAreEqual) {
                // Append values from uniqueValues that are not in givenDomain
                const mergedDomain = [...givenDomain];
                for (const val of domainValues) {
                    if (!givenDomain.includes(val)) {
                        mergedDomain.push(val);
                    }
                }
                domainValues = [...mergedDomain]
            } else {
                domainValues = [...givenDomain] // replace domainValues with the given ones to keep user's preferred order
            }
        }
    
        if (dimension === 'size') { // size requires numeric data
            domainValues = domainValues.map(d => +d)
            let allNumeric = domainValues.every(d => !isNaN(d) && isFinite(d))
            if (!allNumeric) {
                throw new Error(`[${dimension} domain] Numeric data type expected.`)
                return
            }
        }
    
        return domainValues
    }
}

export function calculateSizeDomain({ sparqlResults, dataField, givenDomain }) {
    const calculator = new DomainCalculator();
    return calculator.getDomain({ dimension: 'size', sparqlResults, dataField, givenDomain });
}

export function calculateColorDomain({ sparqlResults, dataField, givenDomain }) {
    const calculator = new DomainCalculator();
    return calculator.getDomain({ dimension: 'color', sparqlResults, dataField, givenDomain });
}