// import * as crypto from 'crypto';
import * as sparql from './sparql_helper.js';
import * as d3 from 'd3';

export async function treatRequest(args) {
    const expectedKeys = ['uri', 'title', 'date', 'ego', 'alter'];

    function endsWithLimitPattern(str) {
        const regex = /\blimit \d+\b/i;
        return regex.test(str);
    }
    
    let variable = args.query.split(/[^A-Za-z0-9$]+/).find(v => v.startsWith('$'));
    let regex = new RegExp("\\" + variable, "g");
    let tunedQuery = args.query.replace(regex, args.value.trim());

    let withOffset = !endsWithLimitPattern(tunedQuery);
    if (withOffset) tunedQuery += 'limit 10000 offset $offset';

    let result = await sparql.executeQuery(tunedQuery, args.endpoint, args.proxy, withOffset);
    
    if (result.message) return result;

    if (!result.length)
        return { message: `Value: ${args.value}\n The query did not return any results.` };

    return result
}

export async function transform(args, data, encoding) {
    let items = []
    const name = (args.name || args.value || args).trim()

    const nodeFields = encoding?.nodes?.field || 'ego';
    const stepField = encoding?.temporal?.field || 'date';
    const linkField = encoding?.links?.field || 'uri';
    const typeField = encoding?.color?.field || 'type';
    const browseField = encoding?.links?.browse?.field || 'link';
    const titleField = encoding?.links?.title?.field || 'title';

    if (!nodeFields || !stepField || !linkField) {
        return { message: `Value: ${name}\nThe encoding is missing one or more required fields: ego, date, and link.` };
    }

    const getNodesValues = (row, filterCriteria) => {
        const getValue = (row, key) => {
            return row?.[key]?.value
        };
        
        let values = Array.isArray(nodeFields) 
            ? nodeFields.map(f => getValue(row, f)).filter(Boolean)
            : [ getValue(row, nodeFields) ]

        if (filterCriteria)
            values = values.map(d => d === filterCriteria)

        return values
    }

    data = data.filter(d => d[stepField]) // keep only entries with a valid step value
        .filter(d => browseField && d[browseField] ? d[browseField].value !== "UNDEF" : true) // keep only values with a valid browse url, if applicable
    
    let egoValues = data.filter(d => getNodesValues(d, name)).flat() // data is treated per ego
    
    let nestedValues = d3.nest().key(d => d[stepField].value).entries(egoValues);

    let node = { name: name, type: args.type, key: await hash(name, args.type?.trim())}
    
    for (let step of nestedValues) {
        
        let uriNested = d3.nest()
            .key(d => d[linkField].value)
            .entries(step.values);

        for (let linkItem of uriNested) {

            let ref = linkItem.values[0];
            let values = linkItem.values;
         
            let alters = values.map(d => getNodesValues(d)).flat()
            alters = [...new Set(alters)]
            alters = alters.map(d => ({ name: d, type: null }))
            
            alters = alters.filter((e, i) => e && alters.findIndex(x => x.name === e.name && x.type === e.type) === i);
            alters = await Promise.all(
                alters.map(async (e) => ({
                ...e,
                key: await hash(e.name, e.type),
                }))
            );

            let types = values.map(e => e[typeField]?.value || null).filter((d, i, arr) => d && arr.indexOf(d) === i);

            let ego = {... alters.find(d => d.name === name)}
            ego.contribution = [...types]

            items.push({
                id: ref[linkField].value,
                node: ego,
                title: ref[titleField].value,
                year: ref[stepField].value, // TODO: change the key to 'step'
                type: types,
                contributors: alters,
                contnames: alters.map(d => d.name),
                parent: ref.parentId ? { name: ref.parentName.value, id: ref.parentId.value } : null,
                link: ref[linkField]?.value
            })
        }
    }

    
    return {
        node: node,
        items: items
    }
}

// export async function fetch(args) {

//     return await treatRequest(args.query, args.endpoint, args.proxy, args.value);
    
//     //if (response.message) return response
  
//     // const data = await transform({
//     //     name: args.value.trim(),
//     //     type: args.type
//     // }, response);

//     // return data
// }

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

