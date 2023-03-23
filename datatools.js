const fs = require('fs');
const path = require('path');
const { datasets } = require('./queries')
const sparql = require('./sparql_helper')

async function fetchItems(db, node) {
    let query;    
    switch(datasets[db].type) {
        case 'sparql':
            query = datasets[db].prefixes + datasets[db].items.replace(/\$author/g, node.value)
            return await sparql.executeQuery(query, datasets[db].url)
        case 'api':
            query = datasets[db].items.replace(/\$category/g, node.type).replace(/\$value/g, encodeURIComponent(node.value))
            let res = await sparql.sendRequest(query)
            return JSON.parse(res)
        default:
            return null;
    }
    
}

async function fetchNodeData(db, node) {
    let query = datasets[db].prefixes + datasets[db].nodeFeatures.replace(/\$author/g, node.value)

    let result = await sparql.sendRequest(sparql.getSparqlUrl(query.replace('$offset', 0), datasets[db].url))
    let bindings;
    try{
        result = JSON.parse(result)
		bindings = result.results.bindings[0]
    } catch(e) {
        console.log(e)
    }

    return bindings

}

async function fetchNodes(db) {
    let data = [];

    switch(datasets[db].type) {
        case 'sparql':
            let query = datasets[db].prefixes + datasets[db].nodeNames
            data = await sparql.executeQuery(query, datasets[db].url)
            data = data.map( d => ( {value: d.value.value} )) 
            break;
        case 'api':
            for (let query of datasets[db].nodeNames) {
                let res = await sparql.sendRequest(query)
                data = data.concat(JSON.parse(res))
            }
            break;
    }
    
    let out = "[" + data.map(el => JSON.stringify(el, null, 4)).join(",") + "]";
    fs.writeFileSync(path.join(__dirname, `/data/${db}/nodes.json`), out)    
    return data
}

async function clean(values) {
    let cleanValues = JSON.parse(JSON.stringify(values))

    cleanValues.forEach( d => {
        Object.keys(d).forEach( key => {
            d[key] = d[key].value

            switch(key) {
                case 'artist':
                    if (d[key] === 'Queen (band)')
                        d[key] = 'Queen'
                    return;
                case 'contributors':
                    if (!d[key]) return;
                    let hasType = false;

                    d[key] = d[key].split('--')
                    d[key] = d[key].map(e => { 

                        let parts = e.split('&&'); 

                        if (parts.length > 1) {
                            hasType = true;
                            let type = parts[0].split('/'); 
                            type = type[type.length - 1]; 
                            return { name: parts[1] === 'Queen (band)' ? 'Queen' : parts[1], type: type }
                        }
                        return { name: e, type: d.type } // when there is no ?p (type) information
                    })
                    if (hasType) d.contribution = d[key].filter(e => e.name === d.artist).map(e => e.type)
                    return;
                default:
                    return;
            }
        })
    })

    return cleanValues
}

async function cleanCroboraResults(values, node) {
    let cleanValues = values.map(d => d.records).flat()

    let categories = ['event', 'location', 'illustration', 'celebrity']
    cleanValues = cleanValues.map(d => {
        
        let getContributors = () => {
            let vals = []
            categories.forEach(key => {
                if (d[key]) d[key].forEach( x => vals.push({ name: x, type: d.channel } ))
            })
            return vals
        }

        return {
            id: d._id,
            artist: node.value,
            name: d.image_title,
            date: d.day_airing,
            type: d.channel,
            contributors: getContributors(),
            link: `http://dataviz.i3s.unice.fr/crobora/document/${d.ID_document}`,
            parentId: d.ID_document,
            parentName: d.document_title,
            parentDate: d.day_airing
        }
    })

    return cleanValues
}

async function getLinkTypes(values) {
    let types = values.map(d => d.contributors.map(e => e.type)).flat()
    return types.filter( (d,i) => d && types.indexOf(d) === i)
}

async function transform(values) {

    let groupedItems = {}
    let items = {}
    let links = {}
    let linkTypes = await getLinkTypes(values)

    for (let item of values) {
        let year = item.parentDate ? item.parentDate.split('-')[0] : item.date.split('-')[0]

        if (year === "0000") continue
        
        let parent = !item.parentId ? null : { id: item.parentId, 
                                                name: item.parentName, 
                                                date: item.parentDate, 
                                                year: year, 
                                                artist: { name: item.parentArtistName || item.artist, id: item.parentArtistId } }

        let contributions = {}
        for (let type of linkTypes){ 
            contributions[type] = item.contributors.filter(e => e.type === type).map(e => e.name);
        }

        let contributors = item.contributors.map(d => d.name)
        contributors = contributors.filter( (d,i) => contributors.indexOf(d) === i) // keep only unique names
        
        let value = {
            artist: {
                name: item.artist,
                contribution: item.contributors.filter(d => d.name === item.artist).map(d => d.type)
            },
            id: item.id,
            name: item.name,
            date: item.date,
            year: year,
            type: item.type,
            contnames: contributors,
            conttypes: contributions,
            parent: parent,
            contCount: contributors.length,
            link: item.link  
        }

        let key = `${item.id}-${item.artist}`
        if (items[key]) {
            value.contnames.forEach( d => { if (!items[key].contnames.includes(d)) items[key].contnames.push(d) })
            Object.keys(value.conttypes).forEach(d => {
                value.conttypes[d].forEach(e => {
                    if (!items[key].conttypes[d].includes(e))
                        items[key].conttypes[d].push(e)
                })  
            })
        } else items[key] = {...value}

        for (let c of item.contributors) {
            if (item.artist === c.name) continue

            let target = item.parentArtistName ? item.parentArtistName : item.artist;
            let key = `${c.name}-${target}-${year}-${item.id}`    
            if (!links[key]) 
                links[key] = {
                    source: c.name,
                    target: target,
                    year: year,
                    type: [],
                    item: {...value}
                }
            
            if (!links[key].type.includes(c.type)) links[key].type.push(c.type)
        }

    }

    for (let item of Object.values(items)) {

        if (!item.parent || (item.parent.artist && item.parent.artist.name != item.artist.name)) {// singles or songs where the artist contributed but that do not belong to them
            groupedItems[item.id] = {...item}
        } else {

            if (item.parent.id && !groupedItems[item.parent.id]) { // albums
                groupedItems[item.parent.id] =  {...item.parent}
                groupedItems[item.parent.id].children = []
            }
            
            groupedItems[item.parent.id].children.push({...item})
        }
                
    }

    return { items: Object.values(items), 
        clusters: Object.values(groupedItems), 
        links: Object.values(links), 
        linkTypes: linkTypes }
     
}

/// for testing the class

async function fetchData(db, node) {
    let values = await fetchItems(db, node) 

    if (datasets[db].type === "sparql")
        values = await clean(values)
    else values = await cleanCroboraResults(values, node)

    // fs.writeFileSync(path.join(__dirname, `/data/${db}/raw.json`), JSON.stringify(values, null, 4))

    let data = await transform(values)

    data.artists = {}
    if (datasets[db].type === "sparql") {
        let res = await fetchNodeData(db, node)
        if (res) {
            let members = null;
            if (res.members) {
                members = res.members.value.split('--')
                    .map(d => {
                        let parts = d.split('&&') 
                        return {
                            name: parts[0],
                            startDate: parts[1] === "NA" ? 'Not Available' : parts[1],
                            endDate: parts[2] === "NA" ? 'Not Available' : parts[2]
                        }
                    })
            }

            data.artists[res.artist.value] = {
                name: res.artist.value,
                id: res.id.value,
                type: res.type.value.split('--'),
                members: members || "Not Available",
                lifespan: { from: res.from ? res.from.value : 'Not Available', to: res.to ? res.to.value : 'Not Available'}
            }
        }

        // data.artists = features
    } else {
        data.artists[node.value] = {
            name: node.value,
            type: node.type
        }
    }

    let filename = `data/${db}/${node.value}${node.type ? '-' + node.type : ''}-data_vis.json`
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 4)) 

    return data
}

// fetchData('crobora', {value: 'Angela Merkel', type: 'celebrity'} )
module.exports = { fetchData, fetchNodes }