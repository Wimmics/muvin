const fs = require('fs');
const path = require('path');

const { datasets } = require('./queries')
const sparql = require('./sparql_helper')

const crypto = require('crypto')

class Transform{
    constructor(db) {
        this.db = db
        this.values

        this.queries = datasets[this.db]
        this.linkTypes = datasets[this.db].categories.map(d => d.toLowerCase())

        this.datapath = `../data/${this.db}`

        this.data = {
            items: null,
            links: null,
            linkTypes: this.linkTypes,
            node: {}
        }
    }

    async fetchItems() {
        let query = this.queries.prefixes + this.queries.items.replace(/\$node/g, this.node.value)
        this.values = await sparql.executeQuery(query, this.queries.url)
    }

    async fetchNodeFeatures() {
        let query = this.queries.prefixes + this.queries.nodeFeatures.replace(/\$node/g, this.node.value)

        let result = await sparql.sendRequest(sparql.getSparqlUrl(query.replace('$offset', 0), this.queries.url))
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
        let filename = `${this.datapath}/${this.node.value}${this.node.type ? '-' + this.node.type : ''}-data_vis.json`
        try {
            let data_to_write = JSON.stringify(this.data, null, 4)
            fs.writeFileSync(path.join(__dirname, filename), data_to_write) 
        } catch(e) {
            console.log(this.data)
            console.log(e)
            
        }
    }

    async getData(node) {
        this.node = node;

        await this.fetchItems()
        if (!this.values.length) return this.values;

        await this.clean()  
        await this.transform()
        let nodeData = await this.fetchNodeFeatures()
        await this.transformNode(nodeData)
        await this.write()

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
 