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
		bindings = result.results.bindings
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
                            let name = parts[1] === 'Queen (band)' ? 'Queen' : parts[1]
                            return { name: name, type: type, key: name }
                        }
                        return { name: e, type: d.type, key: e } // when there is no ?p (type) information
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
    //let channels = ['france 2', 'arte', 'tf1', 'rai uno', 'rai due', 'canale 5']
    let channels = datasets.crobora.categories

    let categories = ['event', 'location', 'illustration', 'celebrity']
    cleanValues = cleanValues.map(d => {
       
        let getContributors = () => {
            let vals = []
            categories.forEach(key => {
                if (d[key]) d[key].forEach( x => vals.push({ name: x, 
                                                            type: channels.includes(d.channel.toLowerCase()) ? d.channel : "Web", 
                                                            category: key, 
                                                            key: [x, key].join('-') } ))
            })
            return vals
        }

        return {
            id: d._id,
            artist: node.value,
            artistType: node.type,
            name: d.image_title,
            date: d.day_airing,
            type: 'image',
            contributors: getContributors(),
            link: `http://dataviz.i3s.unice.fr/crobora/document/${d.ID_document}`,
            parentId: d.ID_document,
            parentName: d.document_title,
            parentDate: d.day_airing
        }
    })

    return cleanValues
}

async function transform(db, values) {

    let items = {}
    let links = {}
    // let linkTypes = await getLinkTypes(values)
    let linkTypes = datasets[db].categories

    for (let item of values) {
        let year = item.parentDate ? item.parentDate.split('-')[0] : item.date.split('-')[0]

        if (year === "0000") continue
        
        let parent = !item.parentId ? null : { id: item.parentId, 
                                                name: item.parentName, 
                                                date: item.parentDate, 
                                                year: year, 
                                                artist: { name: item.parentArtistName || item.artist, 
                                                    id: item.parentArtistId, 
                                                    type: item.parentArtistType || item.artistType } }

        let contributions = {}
        for (let type of linkTypes){ 
            contributions[type] = item.contributors.filter(e => e.type === type).map(e => e.name);
        }

        let contributors = item.contributors.map(d => d.name)
        contributors = contributors.filter( (d,i) => contributors.indexOf(d) === i) // keep only unique names
        
        let value = {
            artist: {
                name: item.artist,
                type: item.artistType,
                key: item.artistType ? [item.artist, item.artistType].join('-') : item.artist,
                contribution: item.contributors.filter(d => d.name === item.artist).map(d => d.type)
            },
            id: item.id,
            name: item.name,
            date: item.date,
            year: year,
            type: item.type,
            contributors: item.contributors,
            contnames: contributors,
            parent: parent,
            contCount: item.contributors.length,
            link: item.link  
        }

        let key = [item.id, item.artist, item.artistType].join('-')

        if (items[key]) {
            value.contnames.forEach( d => { if (!items[key].contnames.includes(d)) items[key].contnames.push(d) })
        } else items[key] = {...value}

        for (let c of item.contributors) {
            if (item.artist === c.name && item.artistType === c.category) continue

            let target = item.parentArtistName ? { name: item.parentArtistName, 
                                                    type: item.parentArtistType, 
                                                    key: item.parentArtistType ? [item.parentArtistName, item.parentArtistType].join('-') : item.parentArtistName} : 
                
                { name: item.artist, type: item.artistType, key: item.artistType ? [item.artist, item.artistType].join('-') : item.artist }

            let source = { name: c.name, type: c.category, key: c.category ? [c.name, c.category].join('-') : c.name }

            let key = [item.id, year, source.name, source.type, target.name, target.type].join('-')
            if (!links[key]) 
                links[key] = {
                    source: source,
                    target: target,
                    year: year,
                    type: [],
                    item: {...value}
                }
            
            if (!links[key].type.includes(c.type)) links[key].type.push(c.type)
        }

    }

    return { items: Object.values(items), 
        links: Object.values(links), 
        linkTypes: linkTypes }
     
}

async function getNodeData(db, node) {
    let data = {}
    let sparql = datasets[db].type === "sparql" 
    let res = sparql  ? await fetchNodeData(db, node) : null

    if (sparql && !res.length) return data

    switch(db) {
        case "wasabi" :
            let members = res.map(d => ({ name: d.memberOf.value, from: d.memberFrom ? d.memberFrom.value : 'Not Available', to: d.memberTo ? d.memberTo.value : 'Not Available' }))

            let birth = res[0].birthDate
            let death = res[0].deathDate

            data[node.value] = {
                key: node.value,
                name: res[0].name.value,
                id: res[0].uri.value,
                type: res[0].type.value,
                lifespan: {from: birth ? birth.value : 'Not Available',  to: death ? death.value : 'Not Available' },
                memberOf: members
            }
            break;
        case "hal":
            let topics = res.filter(d => d.topic).map(d => d.topic.value)
            topics = topics.filter( (d,i) => topics.indexOf(d) === i)

            let structures = res.filter(d => d.memberOf).map(d => d.memberOf.value)
            structures = structures.filter( (d,i) => structures.indexOf(d) === i)
            
            data[node.value] = {
                key: node.value,
                name: res[0].name.value,
                id: res[0].uri.value,
                topics: topics,
                memberOf: structures 
            }
            break;
        case "crobora":
            let key =  [node.value, node.type].join('-')
            data[key] = {
                name: node.value,
                type: node.type,
                key: key
            }
            break;
    }

    return data
}

/// for testing the class

async function fetchData(db, node) {
    let values = await fetchItems(db, node) 

    // fs.writeFileSync(path.join(__dirname, `/data/${db}/raw_beforeclean.json`), JSON.stringify(values, null, 4))

    if (datasets[db].type === "sparql")
        values = await clean(values)
    else values = await cleanCroboraResults(values, node)

    // fs.writeFileSync(path.join(__dirname, `/data/${db}/raw.json`), JSON.stringify(values, null, 4))

    let data = await transform(db, values)

    data.artists = await getNodeData(db, node)

    console.log(data.artists)

    let filename = `data/${db}/${node.value}${node.type ? '-' + node.type : ''}-data_vis.json`
    try {
        data_to_write = JSON.stringify(data, null, 4)
        fs.writeFileSync(path.join(__dirname, filename), data_to_write) 
    } catch(e) {
        console.log(e)
        console.log(data)
    }

    return data
}

// fetchData('crobora', {value: 'Angela Merkel', type: 'celebrity'} )
// fetchData('hal', {value: 'Aline Menin', type: null } )
module.exports = { fetchData, fetchNodes }