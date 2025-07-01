import * as d3 from 'd3'
import { fetchAndTransform } from './transform/transform';

class DataModel {
    constructor(chart) {
        this.chart = chart

        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.linkTypes = []

        this.filters = {
            linkTypes: [],
            timeFrom: null,
            timeTo: null,
            focus: null
        }

        this.colors = { 
            item: '#ccc',
            typeScale: d3.scaleOrdinal(d3.schemeSet2)
        }
    }

    async clear() {
        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.linkTypes = []
    }

    isEmpty() {
        return this.items.length === 0
    }

    async remove(node, focus) {
        
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node)

        //await this.load(await this.getNodesList())
        await this.chart.update()
       
    }

    async reload() {
        let nodes = await this.getNodesList()
       
        await this.clear()
        await this.load(nodes)
    }

    async load(values, body) {    

        this.chart.showLoading()

        let errormessages = []
        
        for (let node of values) {   
            body.value = node.value || node.name
            body.type = node.type
            
            let response = await fetchAndTransform(body)
           
            if (response && response.message) {
                errormessages.push(response.message)
            } else 
                await this.update(response)
        }
       
        if (errormessages.length)
            alert(errormessages.join('\n'))
       
    }

    // updates

    async update(data) {
        
        console.log('DataModel = ', data)
        this.nodes[data.node.key] = data.node 

        await this.updateItems(data.items)

        await this.updateLinks()

        await this.updateCollaborations(data.node.key)

        await this.updateTime()

        await this.updateLinkTypes()

        console.log('links = ', this.links)

        return
    }

    async updateItems(items) {
        
        if (items) { // if new items
            items.forEach(d => { d.year = +d.year })
            this.items = this.items.concat(items)
        }

        // sort items according to the order of nodes, to calculate links
        let nodes = Object.keys(this.nodes)
        this.items.sort( (a,b) => nodes.indexOf(a.node.key) - nodes.indexOf(b.node.key) )

        return
    }

    async updateFilters(type, values) {
        this.filters[type] = values
    }

    getFiltersByType(type){
        return this.filters[type];
    }

    getFocus() {
        return this.filters.focus
    }

    async updateLinkTypes() {
        this.linkTypes = this.items.map(d => d.type).filter(d => d).flat()
        this.linkTypes = this.linkTypes.filter( (d,i) => this.linkTypes.indexOf(d) === i)

        this.colors.typeScale.domain(this.linkTypes)
    }

    async updateTime() {

        let items = await this.getItems()
        this.dates = items.map(d => d.year)
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i) // keep only unique dates

        if (this.filters.timeFrom && this.filters.timeTo)
            this.dates = this.dates.filter(d => d >= this.filters.timeFrom && d <= this.filters.timeTo)

        this.dates.sort((a, b) => a - b);  

        this.filters.timeFrom = this.dates[0]
        this.filters.timeTo = this.dates[this.dates.length - 1]
    }

    async updateCollaborations(key) {
        
        let items = this.items.filter(d => d.node.key === key)
        let collaborators = items.map(d => d.contributors).flat()

        collaborators = collaborators.filter( (d,i) => collaborators.findIndex(e => e.key === d.key) === i && d.key !== key)
        collaborators = collaborators.map(d => { 
            let values = items.filter(e => e.contnames.includes(d.name))
            return { ...d, values: values } 
        })

        this.nodes[key].collaborators = collaborators
            
        await this.sortCollaborators('decreasing', key) // alpha, decreasing (number of shared items)
    }

    async sortCollaborators(value, key) {
        this.nodes[key].sorting = value;

        switch(value) {
            case 'decreasing':
                this.nodes[key].collaborators.sort( (a, b) => { 
                    if (a.enabled && b.enabled) return b.values.length - a.values.length 
                    if (a.enabled) return -1
                    if (b.enabled) return 1 
                    return b.values.length - a.values.length
                })
                break;
            default:
                this.nodes[key].collaborators.sort( (a, b) => { 
                    if (a.enabled && b.enabled) return a.value.localeCompare(b.value)
                    if (a.enabled) return -1
                    if (b.enabled) return 1 
                    return a.name.localeCompare(b.name)
                }) 
        }

    }

    async updateLinks() {
        this.links = []

        let nestedValues = d3.nest()
            .key(d => d.id)
            .entries(this.items)

        let jointItems = nestedValues.filter(d => d.values.length > 1)


        if (!jointItems.length) return

        for (let item of jointItems) {
           
            for (let v1 of item.values) {
                for (let v2 of item.values) {
                    if (v1.node.key === v2.node.key) continue
                    if (v1.year !== v2.year) continue

                    for (let type of v1.type) {
                        this.links.push({
                            source: v1.node,
                            target: v2.node,
                            type: type,
                            item: item.key,
                            year: v1.year
                        })    
                    }
                }
            }
        }

        return
    }

    // checkers

    isNodeValid(node) {
        return Object.keys(this.nodes).includes(node.key)
    }

    // getters 

    async getItems() {

        let uniqueKeys = this.items.map(d => d.contributors.map(e => e.key)).flat()
        uniqueKeys = uniqueKeys.filter((d,i) => uniqueKeys.indexOf(d) === i)

        let items = this.items.filter(d => !d.node.contribution.every(e => this.filters.linkTypes.includes(e)) ) // filter out selected link types
        
        if (this.filters.timeFrom && this.filters.timeTo) {
            items = items.filter(d => d.year >= this.filters.timeFrom && d.year <= this.filters.timeTo)
        }
       
        if (this.filters.focus) {
            let nodes = this.getNodesKeys()

            items = items.filter(d => d.contributors.length > 1 // only collaborative items
                && d.contributors.some(e => e.key === this.filters.focus) // include the author on focus
                && d.contributors.some(e => nodes.includes(e.key) && e.key != this.filters.focus) // every author is visible
                ) 
        }

        return items
    }

    getItemById(key) {
        return this.items.find(d => d.id === key)
    } 

    getLinks() {
       
        let links = this.links.filter(d => !this.filters.linkTypes.includes(d.type) )
      
        if (this.filters.timeFrom && this.filters.timeTo) 
            links = links.filter(d => d.year >= this.filters.timeFrom && d.year <= this.filters.timeTo)
       
        if (this.filters.focus) {
            links = links.filter(d => this.getItemById(d.item).contributors.some(e => e.key === this.filters.focus) )
        }    

        return links
    }

    getStats() {
        return {
            nodes: Object.keys(this.nodes).length,
            items: this.items.length,
            links: this.links.length
        }
    }

    getLinkTypes() {
        return this.linkTypes
    }


    /// Getters for nodes
    getNodesKeys() {
        return Object.keys(this.nodes);
    }

    async getNodesList() {
        return Object.values(this.nodes)
    }

    getNodes() {
        return this.nodes;
    }

    getNodeById(d) {
        return this.nodes[d]
    }

    async switchNodes(indexA, indexB) {
        let keys =  Object.keys(this.nodes)
        let temp = keys[indexA]
        keys[indexA] = keys[indexB]
        keys[indexB] = temp

        let keysOrder = {}
        keys.forEach(key => { keysOrder[key] = null })

        this.nodes = Object.assign(keysOrder, this.nodes)

        await this.updateItems()
        await this.updateLinks()
    }

    getDates() {
        let dates = [...this.dates.filter(d => d >= this.filters.timeFrom && d <= this.filters.timeTo)]
        dates.sort((a,b) => a - b); // Ensure dates are sorted numerically
        return dates;
    }

    getAllDates() {
       
        let values = this.items.map(d => +d.year)
        values = values.filter( (d,i) => values.indexOf(d) === i)
        values.sort()
        return values;
    }

    

    
}

export default DataModel