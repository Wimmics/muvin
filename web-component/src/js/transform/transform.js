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

    let keys = Object.keys(result[0]);
    let containAllKeys = expectedKeys.every(d => keys.includes(d));
    if (!containAllKeys) {
        let missingKeys = expectedKeys.filter(d => !keys.includes(d));
        return { message: `Value: ${args.value}\nThe query is missing the following required variables = ${missingKeys.join(', ')}` };
    }

    return result
}

export async function transform(args, data, encoding) {
    let items = []
    let name = (args.name || args.value || args).trim()

    let egoField = encoding?.nodes?.ego?.field || 'ego';
    let dateField = encoding?.timeline?.field || 'date';
    let linkField = encoding?.links?.field || 'uri';
    let alterField = encoding?.nodes?.alter?.field || 'alter';
    let typeField = encoding?.color?.field || 'type';
    let browseField = encoding?.links?.browse?.field || 'link';
    let titleField = encoding?.links?.title?.field || 'title';

    if (!egoField || !dateField || !linkField || !alterField) {
        return { message: `Value: ${name}\nThe encoding is missing one or more required fields: ego, date, link, alter.` };
    }

    console.log(egoField, dateField, linkField, alterField, typeField)  

    let egoValues = data.filter(d => d[egoField].value === name)
    
    let nestedValues = d3.nest().key(d => d[dateField].value).entries(egoValues);

    let node = { name: name, type: args.type, key: await hash(name, args.type?.trim())}
    
    for (let item of nestedValues) {
        
        let uriNested = d3.nest()
            .key(d => d[linkField].value)
            .entries(item.values);

        for (let uriItem of uriNested) {

            let ref = uriItem.values[0];
            let values = uriItem.values.filter(d => browseField && d[browseField] ? d[browseField].value !== "UNDEF" : true)
            
            let year = ref[dateField].value.split('-')[0];
            if (year === "0000") continue;

            let ego = {...node}
            
            let alters = values.map(e => ({ name: e[alterField]?.value || null, type: e.alterNature?.value || null }));
            if (!alters.some(d => d.name === ego.name))
                alters.push(ego)
            
            alters = alters.filter((e, i) => e && alters.findIndex(x => x.name === e.name && x.type === e.type) === i);
            alters = await Promise.all(
                alters.map(async (e) => ({
                ...e,
                key: await hash(e.name, e.type),
                }))
            );

            let types = values.map(e => e[typeField]?.value || null).filter((d, i, arr) => d && arr.indexOf(d) === i);
            ego.contribution = [...types];

            items.push({
                id: ref[linkField].value,
                node: ego,
                title: ref[titleField].value,
                date: ref[dateField].value,
                year: year,
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

export async function fetch(args) {

    return await treatRequest(args.query, args.endpoint, args.proxy, args.value);
    
    //if (response.message) return response
  
    // const data = await transform({
    //     name: args.value.trim(),
    //     type: args.type
    // }, response);

    // return data
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

