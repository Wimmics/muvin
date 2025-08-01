// import * as crypto from 'crypto';
import * as sparql from './sparql_helper.js';
import * as d3 from 'd3';

export async function treatRequest({
    value, query, endpoint, proxy, 
}) {

    function endsWithLimitPattern(str) {
        const regex = /\blimit \d+\b/i;
        return regex.test(str);
    }
    
    let variable = query.split(/[^A-Za-z0-9$]+/).find(v => v.startsWith('$'));
    let regex = new RegExp("\\" + variable, "g");
    let tunedQuery = query.replace(regex, value.trim());

    let withOffset = !endsWithLimitPattern(tunedQuery);
    if (withOffset) tunedQuery += 'limit 10000';

    let queryParam = `query=${encodeURIComponent(tunedQuery)}`
    let url = `${endpoint}?${queryParam}` // default, if no proxy provided (might result in CORS issues)
    if (proxy)
        url = `${proxy}?endpoint=${endpoint}&${queryParam}` // proxy url sends the query from server side

    let result = await sparql.sendRequest(url)

    if (result?.results?.bindings?.length === 0)
        return { message: `Value: ${value}\n The query did not return any results.` };

    return result
}

function checkFieldValidity(vars, field) {
    if (Array.isArray(field)) {
        for (let f of field) {
            if (!vars.includes(f)) {
                throw new Error(`Invalid field: ${f}`);
            }
        }
    } else if (!vars.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }      
}

export async function transform({
    sparqlResults,
    egoLabel,
    nodesField,
    temporalField,
    eventsField,
    colorField,
    browseField,
    titleField,
    sizeField
}) {
  
    let data = sparqlResults?.results?.bindings

    if (!data) {
        console.error('Mising bindings.')
        return
    }        

    egoLabel = egoLabel.trim() // remove extra spaces

    if (!nodesField || !temporalField || !eventsField) {
        console.error(`Encoding is missing one or more required fields: nodes, events, temporal.`)
        return
    }

    let vars = sparqlResults.head.vars
    checkFieldValidity(vars, nodesField)
    checkFieldValidity(vars, temporalField)
    checkFieldValidity(vars, eventsField)

    const getNodesValues = (row) => {
        const getValue = (row, key) => {
            return row?.[key]?.value
        };
        
        let values = Array.isArray(nodesField) 
            ? nodesField.map(f => getValue(row, f)).filter(Boolean)
            : [ getValue(row, nodesField) ]

        return values
    }

    data = data.filter(d => d[temporalField]) // keep only entries with a valid temporal value
        // .filter(d => browseField && d[browseField] ? d[browseField].value !== "UNDEF" : true) // keep only values with a valid browse url, if applicable
    
    let nestedValues = d3.nest().key(d => d[temporalField].value).entries(data);
    
    let items = [] // it will hold all items
    for (let timeStep of nestedValues) {
        
        let uriNested = d3.nest()
            .key(d => d[eventsField].value)
            .entries(timeStep.values);

        for (let eventItem of uriNested) {

            let ref = eventItem.values[0];

            let nodeValues = eventItem.values.map(d => getNodesValues(d)).flat()
            let egoExists = nodeValues.some(d => d === egoLabel)
            if (!egoExists)
                continue
         
            let alters = eventItem.values.map(d => getNodesValues(d)).flat()
            alters = [...new Set(alters)]
            alters = alters.map(d => ({ name: d, type: null }))
            
            alters = await Promise.all(
                alters.map(async (e) => ({
                ...e,
                key: await hash(e.name, e.type),
                }))
            );

            let egoValues = eventItem.values.filter(d => getNodesValues(d).includes(egoLabel) )
            let types = egoValues.map(e => e[colorField]?.value || null)

            let ego = alters.find(d => d.name === egoLabel)
            ego.contribution = [...types]

            let size = ref[sizeField] && (!isNaN(ref[sizeField].value) && isFinite(ref[sizeField].value))
                ? +ref[sizeField].value
                : alters.length;

            let browseLink = ref[browseField]?.value && ref[browseField]?.value !== 'UNDEF' ? ref[browseField]?.value : null
            items.push({
                id: ref[eventsField].value,
                node: ego,
                title: ref[titleField].value,
                year: ref[temporalField].value, // TODO: change the key to 'step'
                type: [... new Set(types)],
                contributors: alters,
                parent: ref.parentId ? { name: ref.parentName.value, id: ref.parentId.value } : null,
                link: browseLink,
                size: size
            })
        }
    }
    
    return items
}



async function hash(...args) {
    const string = args.join('--');
    const data = new TextEncoder().encode(string)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)

    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

