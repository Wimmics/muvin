const fs = require('fs');
const path = require('path');

const { datasets } = require('./queries')
const sparql = require('./sparql_helper')

const crypto = require('crypto')

const D3Node = require('d3-node')
const d3 = new D3Node().d3  

class Transform{
    constructor(db, config) {
        this.db = db
        this.values

        this.query = config.query || datasets[this.db].queries.items
        this.endpoint = config.endpoint || datasets[this.db].queries.endpoint
        this.nodeQuery = datasets[this.db] ? datasets[this.db].queries.nodeFeatures : null
        this.prefixes = datasets[this.db] ? datasets[this.db].queries.prefixes : ""

        this.linkTypes = datasets[this.db] ? datasets[this.db].categories.map(d => d.toLowerCase()) : []

        this.datapath = `../data/${this.db}`

        this.data = {
            items: null,
            links: null,
            linkTypes: this.linkTypes,
            node: null // incremental version
        }

        this.node = {key: this.hash(config.value),  name: config.value, type: config.type } 
        this.data.node = this.node
    }

    async fetchItems() {
        let query = this.prefixes + this.query.replace(/\$value/g, this.node.name)
        this.values = await sparql.executeQuery(query, this.endpoint)

        let types = this.values.map(d => d.type.value.toLowerCase())
        types = types.filter( (d,i) => types.indexOf(d) === i) 
        this.data.linkTypes = types
    }

    async fetchNodeFeatures() { // to be included directly on the main query
        if (!this.nodeQuery) return;

        let query = this.prefixes + this.nodeQuery.replace(/\$node/g, this.node.name)

        let result = await sparql.sendRequest(sparql.getSparqlUrl(query.replace('$offset', 0), this.endpoint))
        let bindings;
        try{
            result = JSON.parse(result)
            bindings = result.results.bindings
        } catch(e) {
            console.log(e)
        }

        return bindings
    }

    async transformNode() {

    }

    async fetchNodeLabels() {
        let query = this.queries.prefixes + this.queries.nodeNames
        let data = await sparql.executeQuery(query, this.queries.url)
        data = data.map( d => ( {value: d.value.value} )) 

        await this.writeLabels(data)

        return data
    }

    async writeLabels(data) {
        let out = "[" + data.map(el => JSON.stringify(el, null, 4)).join(",") + "]";
        fs.writeFileSync(path.join(__dirname, `${this.datapath}/nodes.json`), out) 
    }

    async clean() {
        
        let nestedValues = d3.nest()
            .key(d => d.uri.value)
            .entries(this.values)

        this.values = nestedValues.map(d => {

            let ref = d.values[0]

            let alters = d.values.map(e => e.alter.value)
            alters = alters.filter( (e,i) => alters.indexOf(e) === i)

            return {
                id: ref.uri.value,
                title: ref.title.value,
                date: ref.date.value,
                type: ref.type.value.toLowerCase(),
                link: ref.link.value,

                nodeName: ref.ego.value,
                nodeContribution: [ ref.type.value.toLowerCase() ],

                contributors: alters.map(e => ({ name: e, type: ref.type.value.toLowerCase() })),
            }
        })
   
    }

    async transform() {
        let items = {}
        let links = {}
    
        for (let item of this.values) {
            let year = item.parentDate ? item.parentDate.split('-')[0] : item.date.split('-')[0]
    
            if (year === "0000") continue
            
            let parent = !item.parentId ? null : { id: item.parentId, 
                                                    title: item.parentTitle, 
                                                    date: item.parentDate,
                                                    type: item.parentType, 
                                                    year: year, 
                                                    node: item.parentId ? { name: item.parentNodeName, 
                                                        id: item.parentNodeId, 
                                                        type: item.parentNodeType } : null }
                                                        
            item.contributors = item.contributors.map(e => ({...e, key: e.category ? this.hash(e.name, e.category) : this.hash(e.name)}))
            
            let nodeKey = item.nodeType ? this.hash(item.nodeName, item.nodeType) : this.hash(item.nodeName)
            let value = {
                node: {
                    name: item.nodeName,
                    type: item.nodeType,
                    key: nodeKey,
                    contribution: item.nodeContribution
                },
                id: item.id,
                title: item.title,
                date: item.date,
                year: year,
                type: item.type,
                contributors: item.contributors,
                contnames: item.contributors.map(d => d.name),
                parent: parent,
                link: item.link, 
                nodeLink: item.nodeLink  
            }
    
            let key = this.hash(item.id, item.artist, item.artistType)
    
            items[key] = {...value}
    
            for (let source of item.contributors) {
                if (item.key === source.key) continue

                
    
                let target = item.parentNodeName ? { name: item.parentNodeName, 
                                                    type: item.parentNodeType, 
                                                    key: item.parentNodeType ? this.hash(item.parentNodeName, item.parentNodeType) : this.hash(item.parentNodeName) } : 
                                                            { name: item.nodeName, type: item.nodeContribution, key: nodeKey }
    

                let sourceKey = this.hash(item.id, year, source.name, source.type, target.name, target.type)
                let targetKey = this.hash(item.id, year, target.name, target.type, source.name, source.type)

                if (!links[sourceKey] && !links[targetKey])  
                    links[sourceKey] = {
                        source: source,
                        target: target,
                        year: year,
                        type: source.type,
                        item: value.id
                    }
            }       
    
        }

        this.data.items = Object.values(items)
        this.data.links = Object.values(links)

    }

    async write() {
        let filename = `${this.datapath}/${this.node.name}${this.node.type ? '-' + this.node.type : ''}-data_vis.json`
        try {
            let data_to_write = JSON.stringify(this.data, null, 4)
            fs.writeFileSync(path.join(__dirname, filename), data_to_write) 
        } catch(e) {
            console.log(this.data)
            console.log(e)
        }
    }

    async getData() {
        await this.fetchItems()
        if (!this.values.length) return this.values;

        await this.clean()  
        await this.transform()
        let nodeData = await this.fetchNodeFeatures()
        await this.transformNode(nodeData)
        if(this.db !== "demo") await this.write()

        return this.data
    }

    hash() {
       
        let string = Object.values(arguments).join('--')

        return crypto.createHash('sha256').update(string).digest('hex')
    }
}

module.exports = {
    Transform: Transform
}
 