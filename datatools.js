const fs = require('fs');
const path = require('path');
const { entpoints, queries, endpoints } = require('./queries')
const sparql = require('./sparql_helper')

async function fetchItems(db, author) {
    let query = queries[db].prefixes + queries[db].items.replace(/\$author/g, author)

    return await sparql.executeQuery(query, endpoints[db])

}

async function fetchNodeData(db, author) {
    let query = queries[db].prefixes + queries[db].nodeFeatures.replace(/\$author/g, author)

    let result = await sparql.sendRequest(query.replace('$offset', 0), endpoints[db])
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
    let query = queries[db].prefixes + queries[db].nodeNames

    let data = await sparql.executeQuery(query, endpoints[db])
    let out = "[" + data.map(el => JSON.stringify(el, null, 4)).join(",") + "]";
    fs.writeFileSync(path.join(__dirname, `/data/${db}/nodes.json`), out)    
    return data
}

async function clean() {
    let values = JSON.parse(JSON.stringify(arguments[0]))
   
    values.forEach( d => {
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

    return values
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
                                                artist: { name: item.parentArtistName, id: item.parentArtistId }, 
                                                type: 'album'}

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

            let target = item.parentId ? item.parentArtistName : item.artist;
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

        if (!item.parent || item.parent.artist.name != item.artist.name) {// singles or songs where the artist contributed but that do not belong to them
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
    values = await clean(values)

    let data = await transform(values)

    let features = {}
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

        features[res.artist.value] = {
            name: res.artist.value,
            id: res.id.value,
            type: res.type.value.split('--'),
            members: members || "Not Available",
            lifespan: { from: res.from ? res.from.value : 'Not Available', to: res.to ? res.to.value : 'Not Available'}
        }
    }

    data.artists = features

    // the following are for debugging
    // fs.writeFileSync(path.join(__dirname, `/data/${db}/${node}-wasabidata_items.json`), JSON.stringify(data.items, null, 4))
    // fs.writeFileSync(path.join(__dirname, `/data/${db}/${node}-wasabidata_grouped.json`), JSON.stringify(data.groupedItems, null, 4))
    // fs.writeFileSync(path.join(__dirname, `/data/${db}/${node}-wasabidata_links.json`), JSON.stringify(data.links, null, 4))  

    fs.writeFileSync(path.join(__dirname, `/data/${db}/${node}-data_vis.json`), JSON.stringify(data, null, 4)) 

    return data
}

// fetchData()
module.exports = { fetchData, fetchNodes }