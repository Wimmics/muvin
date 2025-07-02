// import * as crypto from 'crypto';
import * as sparql from './sparql_helper.js';
import * as d3 from 'd3';

async function treatRequest(query, endpoint, proxy, value) {
    const expectedKeys = ['uri', 'title', 'date', 'ego', 'alter'];

    function endsWithLimitPattern(str) {
        const regex = /\blimit \d+\b/i;
        return regex.test(str);
    }
    
    let variable = query.split(/[^A-Za-z0-9$]+/).find(v => v.startsWith('$'));
    let regex = new RegExp("\\" + variable, "g");
    let tunedQuery = query.replace(regex, value.trim());

    let withOffset = !endsWithLimitPattern(tunedQuery);
    if (withOffset) tunedQuery += 'limit 10000 offset $offset';

    let result = await sparql.executeQuery(tunedQuery, endpoint, proxy, withOffset);
    
    if (result.message) return result;

    if (!result.length)
        return { message: `Value: ${value}\n The query did not return any results.` };

    let keys = Object.keys(result[0]);
    let containAllKeys = expectedKeys.every(d => keys.includes(d));
    if (!containAllKeys) {
        let missingKeys = expectedKeys.filter(d => !keys.includes(d));
        return { message: `Value: ${value}\nThe query is missing the following required variables = ${missingKeys.join(', ')}` };
    }

    return result
}

export async function transform(args, data) {
    let items = []
    let name = (args.name || args.value || args).trim()

    let egoValues = data.filter(d => d.ego.value === name)

    let nestedValues = d3.nest().key(d => d.date.value).entries(egoValues);

    let node = { name: name, type: args.type, key: await hash(name, args.type?.trim())}
    
    for (let item of nestedValues) {
        
        let uriNested = d3.nest()
            .key(d => d.uri.value)
            .entries(item.values);

        for (let uriItem of uriNested) {

            let ref = uriItem.values[0];
            let values = uriItem.values.filter(d => d.link ? d.link.value !== "UNDEF" : true)
            
            let year = ref.date.value.split('-')[0];
            if (year === "0000") continue;

            let ego = {...node}
            
            let alters = values.map(e => ({ name: e.alter?.value || null, type: e.alterNature?.value || null }));
            if (!alters.some(d => d.name === ego.name))
                alters.push(ego)
            
            alters = alters.filter((e, i) => e && alters.findIndex(x => x.name === e.name && x.type === e.type) === i);
            alters = await Promise.all(
                alters.map(async (e) => ({
                ...e,
                key: await hash(e.name, e.type),
                }))
            );

            let types = values.map(e => e.type?.value || null).filter((d, i, arr) => d && arr.indexOf(d) === i);
            ego.contribution = [...types];

            items.push({
                id: ref.uri.value,
                node: ego,
                title: ref.title.value,
                date: ref.date.value,
                year: year,
                type: types,
                contributors: alters,
                contnames: alters.map(d => d.name),
                parent: ref.parentId ? { name: ref.parentName.value, id: ref.parentId.value } : null,
                link: ref.link?.value
            })
        }
    }

    return {
        node: node,
        items: items
    }
}

export async function fetchAndTransform(args) {

    let response = await treatRequest(args.query, args.endpoint, args.proxy, args.value);
    
    if (response.message) return response
  
    const data = await transform({
        name: args.value.trim(),
        type: args.type
    }, response);

    return data
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

