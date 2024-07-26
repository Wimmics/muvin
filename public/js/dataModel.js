class DataModel {
    constructor(app, obj) {
        this.chart = document.querySelector('#muvin')
        this.app = app

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

        Object.assign(this, obj)

        if (!this.query) this.fetchNodesLabels(this.app)

        this.route = this.chart.baseUrl + '/muvin/data/' + this.app

    }

    async fetchData(node) {
        let body;
        if (this.query) {
            body = { query: this.query, endpoint: this.endpoint, value: node.value, type: node.type} 
        } else {
            body = { value: node.value, type: node.type } 
        }

        fetch(this.route, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        }).then(response => {
            return response.text();
        }).then(text => {
            this.update(JSON.parse(text))
        }).catch(error => {
            // console.log(error)
            alert(error);
        });
    }

    async fetchNodesLabels(value) {
        const response = await fetch(this.chart.baseUrl + '/muvin/data/' + value + '/nodes')
        this.nodeLabels = await response.json()
        
    }

    async clear() {
        this.clusters = []
        this.items = []
        this.nodes = {}
        this.links = []
        this.linkTypes = []

        window.open(this.chart.url, "_self") 
    }

    isEmpty() {
        return this.items.length === 0
    }

    async remove(node, focus) {
        
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node)

        this.updateTime()
        this.open()
    }

    async load(values) {    

        this.chart.showLoading()

        values.forEach(node => this.fetchData(node))
       
    }

    // This method was replaced by load() ; TODO: test the replacement on all use cases
    async open(nodes) {
        console.log('open() nodes = ', nodes)

        if (this.query){
            nodes.forEach(node => this.fetchData(node))
            return
        }

        let url = this.chart.url + '?'

        // if (this.query) url += `endpoint=${this.endpoint}&query=${encodeURIComponent(this.query)}&` // for the visualizations launched from ldviz

        let values = []
        Object.keys(this.nodes).forEach(d => {
            let v = `value=${this.nodes[d].name}`
            if (this.nodes[d].type && this.chart.app !== 'wasabi')
                v += `&type=${this.nodes[d].type}`

            values.push(v)
        })

        if (nodes)
            nodes.forEach(node => {
                values.push('value=' + node.value + (node.type && this.chart.app !== 'wasabi' ? '&type=' + node.type : ''))
            })

        url += values.join('&')

        window.open(url, "_self")
    }


    // updates

    async update(data) {
        
        if (!Object.keys(data).includes('items')) return
        
        data.items.forEach(d => { d.year = +d.year })
        data.links.forEach(d => { d.year = +d.year })

        this.items = this.items.concat(data.items)
        this.links = this.links.concat(data.links) 
        this.nodes[data.node.key] = data.node 
       
        this.linkTypes = data.linkTypes
        this.colors.typeScale.domain(this.linkTypes)

        await this.updateCollaborations(data.node.key)

        await this.updateTime()

        console.log(this)
        
        this.chart.update()

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
        if (this.filters.focus) {
            this.dates = this.getItems().map(d => d.year)
        } else {
            this.dates = this.items.map(d => d.year)
        }
        
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i)
        this.dates.sort()

        this.filters.timeFrom = this.dates[0]
        this.filters.timeTo = this.dates[this.dates.length - 1]
    }

    async updateCollaborations(key) {
        
        //Object.keys(this.nodes).forEach(async (key) => {
            let items = this.items.filter(d => d.node.key === key)
            let collaborators = items.map(d => d.contributors).flat()

            collaborators = collaborators.filter( (d,i) => collaborators.findIndex(e => e.key === d.key) === i && d.key !== key)
            collaborators = collaborators.map(d => { 
                let values = items.filter(e => e.contnames.includes(d.name))
                return { 
                    value: d.name, 
                    type: d.category, 
                    key: d.key, 
                    //enabled: this.isNodeExplorable(d), 
                    values: values
                } 
            })

            this.nodes[key].collaborators = collaborators
                

            await this.sortCollaborators('decreasing', key) // alpha, decreasing (number of shared items)
        //})
        
        
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

        let nodes = this.getNodesKeys()

        links = links.filter( (d,i) => links.findIndex(e => e.item === d.item && 
                e.type === d.type &&
                ((e.source.key === d.source.key && e.target.key === d.target.key) || (e.source.key === d.target.key && e.target.key === d.source.key)) &&
                e.year === d.year) === i)

        links = links.filter( d => nodes.includes(d.source.key) && nodes.includes(d.target.key))
        links = links.filter( d => d.source.key !== d.target.key)
       
        if (this.filters.focus) {
            links = links.filter(d => this.getItemById(d.item).contributors.some(e => e.key === this.filters.focus) )
        }    

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

    getNodesOrder() {
        return Object.keys(this.getNodesList())
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
        let labels = this.nodeLabels.filter(d => d.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.value.localeCompare(b.value))

        return labels
    }

    getNode(value) {
        return this.nodeLabels.find(d => d.value === value)
    }
}