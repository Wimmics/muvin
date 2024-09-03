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

        if (this.app !== 'preview') this.fetchNodesLabels(this.app)

        this.route = this.chart.baseUrl + '/muvin/data/' + this.app

    }


    async fetchData(node) {
        let body = { query: this.query, endpoint: this.endpoint, value: node.value || node.name, type: node.type, hashCode: this.chart.hashCode } 
        
        let response = fetch(this.route, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        }).then(response => {
            return response.json()
        }).catch(error => {
            alert(error);
        })

        return response
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
    }

    isEmpty() {
        return this.items.length === 0
    }

    async remove(node, focus) {
        
        delete this.nodes[node];
        this.items = this.items.filter(d => d.node.key !== node)

        await this.load(await this.getNodesList())
       
    }

    async reload() {
        let nodes = await this.getNodesList()
       
        await this.clear()
        await this.load(nodes)
    }

    async load(values) {    

        this.chart.showLoading()

        let errormessages = []
        let response;
        for (let node of values) {   
           
            response = await this.fetchData(node)
            
            if (response && response.message) {
                errormessages.push(response.message)
            } else 
                await this.update(response)
        }

        await this.updateTime()
        await this.updateLinkTypes()
        
        await this.chart.update()

        if (errormessages.length)
            alert(errormessages.join('\n'))
       
    }

    // updates

    async update(data) {
        
        data.items.forEach(d => { d.year = +d.year })
        data.links.forEach(d => { d.year = +d.year })

        this.items = this.items.concat(data.items)
        this.links = this.links.concat(data.links) 
        this.nodes[data.node.key] = data.node 

        await this.updateCollaborations(data.node.key)

        console.log(this)
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
        this.linkTypes = this.items.map(d => d.type).filter(d => d)
        this.linkTypes = this.linkTypes.filter( (d,i) => this.linkTypes.indexOf(d) === i)

        this.colors.typeScale.domain(this.linkTypes)
    }

    async updateTime() {
        if (this.filters.focus) {
            let items = await this.getItems()
            this.dates = items.map(d => d.year)
        } else {
            this.dates = this.items.map(d => d.year)
        }
        
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
                //enabled: this.isNodeExplorable(d), 
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

    async getNodesList() {
        return Object.values(this.nodes)
    }

    getNodes() {
        return this.nodes;
    }

    getNodeById(d) {
        return this.nodes[d]
    }

    // async getNodesOrder() {
    //     return await Object.keys(this.getNodesList())
    // }

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