class DataModel {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.linkTypes = []

        this.filters = {
            linkTypes: [],
            timeFrom: null,
            timeTo: null
        }

        this.colors = { 
            item: '#ccc',
            typeScale: d3.scaleOrdinal(d3.schemeSet2)
        }
    }

    async init() {
       
    }

    async fetchData(node) {

        const response = await fetch('/muvin/data/' + this.chart.app + '?value=' + node.value + '&type=' + node.type)

        return await response.json()
    }

    async fetchNodesLabels(value) {
        const response = await fetch('/muvin/data/' + value + '/nodes')
        this.nodeLabels = await response.json()
        
    }

    async clear() {
        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.linkTypes = []
    }

    async remove(node, focus) {
        
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node)

        this.updateTime()
        this.chart.update(focus)
    }

    async add(node) {

        this.chart.showLoading()

        let data = await this.fetchData(node)
        await this.update(data)
        
        this.updateTime()
        
        this.chart.update(node)
    }

    // updates

    async update(data) {
        
        if (!Object.keys(data).includes('items')) return
        
        data.items.forEach(d => { d.year = +d.year })

        data.links.forEach(d => { d.year = +d.year })

        this.items = this.items.concat(data.items)
        this.links = this.links.concat(data.links) 
        this.nodes[data.node.key] = data.node

        // update linkTypes only once 
        if (!this.linkTypes.length) {
            this.linkTypes = data.linkTypes
            this.colors.typeScale.domain(this.linkTypes)
        }

        await this.updateCollaborations(data.node.key)

    }

    async updateFilters(type, values) {
        this.filters[type] = values
    }

    getFiltersByType(type){
        return this.filters[type];
    }

    async updateTime() {
        this.dates = this.items.map(d => d.year)
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i)
        this.dates.sort()

        this.filters.timeFrom = this.dates[0]
        this.filters.timeTo = this.dates[this.dates.length - 1]
    }

    async updateCollaborations(key) {
       
        let items = this.items.filter(d => d.node.key === key)
        let collaborators = items.map(d => d.contributors).flat()

        collaborators = collaborators.filter( (d,i) => collaborators.findIndex(e => e.key === d.key) === i && d.key !== key)
        collaborators = collaborators.map(d => { 
            let values = items.filter(e => e.contnames.includes(d.name))
            return { 
                value: d.name, 
                type: d.category, 
                key: d.key, 
                enabled: this.isNodeExplorable(d), 
                values: values
            } 
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
                    return a.value.localeCompare(b.value)
                }) 
        }

    }

    // checkers

    isNodeValid(node) {
        return Object.keys(this.nodes).includes(node.key)
    }


    isNodeExplorable(node){
        return this.nodeLabels.some(d => d.type ? d.value === node.name && d.type === node.category : d.value === node.name)
    }

    // getters 

    getItems() {
        let items = this.items.filter(d => !d.node.contribution.every(e => this.filters.linkTypes.includes(e)) )
        items = items.filter(d => d.year >= this.filters.timeFrom && d.year <= this.filters.timeTo)
        return items
    }

    getItemById(key) {
        return this.items.find(d => d.key === key)
    } 

    getLinks() {
        let links = this.links.filter(d => !d.type.every(e => this.filters.linkTypes.includes(e)) )
        links = links.filter(d => +d.year >= this.filters.timeFrom && +d.year <= this.filters.timeTo)
        return links
    }

    getLinkTypes() {
        return this.linkTypes
    }


    /// Getters for nodes
    getNodesKeys() {
        return Object.keys(this.nodes);
    }

    getNodesList() {
        return Object.values(this.nodes)
    }

    getNodes() {
        return this.nodes;
    }

    getNodeById(d) {
        return this.nodes[d]
    }

    switchNodes(indexA, indexB) {
        let keys =  Object.keys(this.nodes)
        let temp = keys[indexA]
        keys[indexA] = keys[indexB]
        keys[indexB] = temp

        let keysOrder = {}
        keys.forEach(key => { keysOrder[key] = null })

        this.nodes = Object.assign(keysOrder, this.nodes)
    }

    getDates() {
        let dates = this.dates.filter(d => d >= this.filters.timeFrom && d <= this.filters.timeTo)
        dates.sort()
        return dates;
    }

    getAllDates() {
        let values = this.items.map(d => +d.year)
        values = values.filter( (d,i) => values.indexOf(d) === i)
        values.sort()
        return values;
    }

    getMatchingLabels(value) {
        let labels = this.chart.data.nodeLabels.filter(d => d.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.value.localeCompare(b.value))

        return labels
    }

}