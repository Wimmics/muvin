class DataModel {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.clusters = []
        this.items = []
        this.artists = {}
        this.links = []
        this.linkTypes = []

        this.filters = {
            linkTypes: []
        }

        this.colors = { // TODO - find a more direct way of selecting the colors (like colors.song)
            cluster: {
                color: '#fff',
                gradient: ['#ffffff', '#f5f5f5', '#ececec', '#e2e2e2'] // used by the audio player
            },
            item: {
                color: '#ab418f',
                gradient: ['#9e2e09', '#c36846', '#e3a084', '#ffd8c8']
            }
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
        this.artists = {}
        this.links = []
        this.linkTypes = []
    }

    async remove(node, focus) {
        delete this.artists[node];
        this.items = this.items.filter(d => d.artist.key !== node)

        this.updateTime()
        this.updateColors()
        this.updateCollaborations()
        this.chart.update(focus)
    }

    async add(node) {

        this.chart.showLoading()

        let data = await this.fetchData(node)
        await this.update(data)
        
        this.updateTime()
        this.updateColors()
        await this.updateCollaborations()
        this.chart.update(node)
    }

    // updates

    async update(data) {
        
        if (!Object.keys(data).includes('items')) return
        
        this.items = this.items.concat(data.items)
        this.links = this.links.concat(data.links)
        
        data.linkTypes.forEach(d => {
            if (!this.linkTypes.includes(d)) this.linkTypes.push(d)
        })
        this.linkTypes.sort( (a,b) => a.localeCompare(b))

        Object.keys(data.artists).forEach(d => {
            this.artists[d] = data.artists[d]
        })
        
        console.log(this)

    }

    async updateFilters(type, values) {
        this.filters[type] = values

        this.chart.update()
    }

    async updateTime() {
        this.dates = this.items.map(d => d.year)
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i)
        this.dates.sort()
    }

    async updateCollaborations() {
        Object.keys(this.artists).forEach(key => {
            let collaborators = this.items.filter(d => d.artist.key === key).map(d => d.contributors).flat()
    
            collaborators = collaborators.filter( (d,i) => collaborators.findIndex(e => e.key === d.key) === i && d.key !== key)
            collaborators = collaborators.map(d => { return { value: d.name, type: d.category, key: d.key, enabled: this.isNodeExplorable(d) } })
            
            collaborators.sort( (a, b) => { 
                if (a.enabled && b.enabled) return a.value.localeCompare(b.value)
                if (a.enabled) return -1
                if (b.enabled) return 1 
                return a.value.localeCompare(b.value)
            })

            this.artists[key].collaborators = collaborators
        })
    }

    async updateColors() {

        let nb = this.linkTypes.length < 3 ? 3 : this.linkTypes.length
        let colors = d3.schemeGreens[nb]
      
        this.colors.discography = {
                color: colors ? colors[0] : '#000',
                gradient: colors
            }

        this.colors.typeScale = d3.scaleOrdinal(colors).domain(this.linkTypes)

    }

    // checkers

    isNodeValid(node) {
        return Object.keys(this.artists).includes(node.key)
    }


    isNodeExplorable(node){
        return this.nodeLabels.some(d => d.type ? d.value === node.name && d.type === node.category : d.value === node.name)
    }

    // getters 

    getItems() {
        return this.items.filter(d => !d.artist.contribution.every(e => this.filters.linkTypes.includes(e)) )
    }

    getLinks() {
        return this.links.filter(d => !d.type.every(e => this.filters.linkTypes.includes(e)) )
    }

    getLinkTypes() {
        return this.linkTypes
    }

    getNodesKeys() {
        return Object.keys(this.artists);
    }

    getNodesList() {
        return Object.values(this.artists)
    }

    getNodes() {
        return this.artists;
    }

    switchNodes(indexA, indexB) {
        let keys =  Object.keys(this.artists)
        let temp = keys[indexA]
        keys[indexA] = keys[indexB]
        keys[indexB] = temp

        let keysOrder = {}
        keys.forEach(key => { keysOrder[key] = null })

        this.artists = Object.assign(keysOrder, this.artists)
    }

    getDates() {
        let dates = this.items.map(d => d.year)
        dates = dates.filter( (d,i) => dates.indexOf(d) === i)
        dates.sort()
        return dates;
    }

    getMatchingLabels(value) {
        let labels = this.chart.data.nodeLabels.filter(d => d.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.value.localeCompare(b.value))

        return labels
    }

}