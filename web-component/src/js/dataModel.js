import * as d3 from 'd3'
import { treatRequest, transform } from './transform/transform';
import { calculateColorDomain, calculateSizeDomain } from './lib/DomainCalculator';

class DataModel {
    constructor(chart) {
        this.chart = chart

        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []

        this.filters = {
            linkTypes: [],
            timeFrom: null,
            timeTo: null,
            focus: null
        }

        this.domainValues = {
            color: null,
            size: null
        }
    }

    async clear() {
        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.dates = []

        this.filters = {
            linkTypes: [],
            timeFrom: null,
            timeTo: null,
            focus: null
        }
    }

    isEmpty() {
        return this.items.length === 0
    }

    async remove(node, focus) {
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node)
        await this.chart.update()
    }

    async reload() {
        let nodes = await this.getNodesList()
       
        await this.clear()
        await this.load(nodes)
    }

    async load(values) {    
        if (!values || !values.length) {
            console.warn('No values provided to load data model')
            return
        }
        
        this.chart.showLoading()

        let body = { query: this.chart.sparqlQuery, 
                    endpoint: this.chart.sparqlEndpoint, 
                    proxy: this.chart.sparqlProxy, 
                    token: this.chart.token }

        let errormessages = []

        const treatNode = async (node, body) => {
            let response = await treatRequest(body)
           
            if (response && response.message) {
                errormessages.push(response.message)
            } else  {
                await this.addData(node, response)
            }
        }

        if (Array.isArray(values)) {
            for (let node of values) {   
                body.value = node.value || node.name || node
                body.type = node.type

                await treatNode(node, body)
            }
        } else if (typeof values === 'string') {
            body.value = values
            body.type = null

            await treatNode(values, body)
        }
       
        if (errormessages.length)
            alert(errormessages.join('\n'))
       
    }

    async addData(node, sparqlResults) {
        let encoding = this.chart.encoding
        let defaultEncoding = this.chart.getDefaultEncoding()

        let options = {
            sparqlResults: sparqlResults,
            egoLabel: node.name || node.value || node,
            nodesField: encoding?.nodes?.field || defaultEncoding.nodes.field,
            temporalField: encoding?.temporal?.field || defaultEncoding.temporal.field,
            eventsField: encoding?.events?.field || defaultEncoding.events.field,
            colorField: encoding?.color?.field || defaultEncoding.color.field,
            browseField: encoding?.events?.browse?.field || defaultEncoding.events.browse.field,
            titleField: encoding?.events?.title?.field || defaultEncoding.events.title.field,
            sizeField: encoding?.size?.field || defaultEncoding.size.field
        }

        let data = await transform(options)
        if (!data) return

        await this.update(data)
        await this.updateDomainValues(sparqlResults)
    }

    // updates

    async update(data) {
        
        if (!data.length)
            return

        let node = data[0]?.node
        this.nodes[node.key] = { ...node }

        await this.updateItems(data)

        await this.updateLinks()

        await this.updateCollaborations(node.key)

        await this.updateTime()

        return
    }

    async updateDomainValues(sparqlResults) {
        let encoding = this.chart.encoding
        let defaultEncoding = this.chart.getDefaultEncoding()

        // Compute domain values for color scalee
        let colorOptions = {
            sparqlResults: sparqlResults,
            dataField: encoding?.color?.field || defaultEncoding.color.field,
            givenDomain: encoding?.color?.scale?.domain || defaultEncoding.color.scale.domain
        }
       
        let currentColorDomain = this.domainValues.color || []
        let extendedColorDomain = currentColorDomain.concat(calculateColorDomain(colorOptions))
        this.domainValues.color = [...new Set(extendedColorDomain)]

        // Compute domain values for size scale
        let sizeOptions = {
            sparqlResults: sparqlResults,
            dataField: encoding?.size?.field || defaultEncoding.size.field,
            givenDomain:  encoding?.size?.scale?.domain || defaultEncoding.size.scale.domain
        }

        let sizeDomain = calculateSizeDomain(sizeOptions)

        if (!sizeDomain) { // Default size domain: count of co-occurrent items
            sizeDomain = this.items.map(d => d.size)
            sizeDomain = [...new Set(sizeDomain)]
        }

        let currentSizeDomain = this.domainValues.size || []
        let extendedSizeDomain = currentSizeDomain.concat(sizeDomain)
        
        this.domainValues.size = [...new Set(extendedSizeDomain)]
        this.domainValues.size.sort( (a,b) => a - b)

    }

    getSizeDomain() {
        return this.domainValues.size
    }

    getColorDomain() {
        return this.domainValues.color
    }

    async updateItems(items) {
        
        if (items) { // if new items
            items.forEach(d => { 
                if (!isNaN(+d.year) && isFinite(+d.year)) 
                    d.year = +d.year 
                })
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
            let values = items.filter(e => e.contributors.some(x => x.name === d.name))
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
                            item: item.key,
                            source: v1.node,
                            target: v2.node,
                            year: v1.year,
                            type: type
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