class DataModel {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.clusters = []
        this.items = []
        this.artists = {}
        this.links = []
        this.linkTypes = []

    }

    async init() {
        
    }

    async fetchData(node) {
        let data = this.nodeLabels.find(d => d.value === node)

        const response = await fetch('/muvin/data/' + this.chart.app + '?value=' + node + '&type=' + data.type)

        return await response.json()
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
        this.items = this.items.filter(d => d.artist.name !== node)
        this.clusters = this.clusters.filter(d => d.artist.name !== node)

        this.setColors()
        this.setCollaborations()
        this.chart.update(Object.keys(this.artists), focus)
    }

    async add(node) {

        this.chart.showLoading()

        let data = await this.fetchData(node)
        await this.update(data)
        
        this.setColors()
        this.setCollaborations()
        this.chart.update(Object.keys(this.artists), node)
    }

    async update(data) {
        this.clusters = this.clusters.concat(data.clusters)
        this.items = this.items.concat(data.items)
        this.links = this.links.concat(data.links)
        
        data.linkTypes.forEach(d => {
            if (!this.linkTypes.includes(d)) this.linkTypes.push(d)
        })
        this.linkTypes.sort( (a,b) => a.localeCompare(b))

        Object.keys(data.artists).forEach(d => {
            this.artists[d] = data.artists[d]
        })        
    }

    isNodeValid(node) {
        return Object.keys(this.artists).includes(node)
    }

    getNodes() {
        return Object.keys(this.artists);
    }

    getDates() {
        let dates = this.items.map(d => d.year)
        dates = dates.filter( (d,i) => dates.indexOf(d) === i)
        dates.sort()
        return dates;
    }

    updateNodes(values) {
        this.nodes = [...values]
    }

    updateTime() {
        this.dates = this.items.filter(d => !this.chart.displayBestOfs() ? d.audio && this.chart.isNodeVisible(d.artist.name || d.artist) : 
            this.chart.isNodeVisible(d.artist.name)).map(d => d.year)
        this.dates = this.dates.filter((d,i) => this.dates.indexOf(d) === i)
        this.dates.sort()
    }
    
    async getNodesLabels(value) {
        const response = await fetch('/muvin/data/' + value + '/nodes')
        this.nodeLabels = await response.json()
        
    }

    isNodeExplorable(node){
        return this.nodeLabels.some(d => d.value === node)
    }

    getMatchingLabels(value) {
        let labels = this.chart.data.nodeLabels.filter(d => d.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.value.localeCompare(b.value))

        return labels
    }

    setCollaborations() {
        Object.keys(this.artists).forEach(key => {
            let collaborators = this.items.filter(d => d.artist.name === key).map(d => d.contnames).flat()
            collaborators = collaborators.filter( (d,i) => collaborators.indexOf(d) === i && d !== key)
            collaborators = collaborators.map(d => { return { name: d, enabled: this.isNodeExplorable(d) } })

            collaborators.sort( (a, b) => { 
                if (a.enabled && b.enabled) return a.name.localeCompare(b.name)
                if (a.enabled) return -1
                if (b.enabled) return 1 
                return a.name.localeCompare(b.name)
            })

            this.artists[key].collaborators = collaborators
        })
    }

    setColors() {


        this.colors = { // TODO - find a more direct way of selecting the colors (like colors.song)
            cluster: {
                color: '#fff',
                gradient: ['#ffffff', '#f5f5f5', '#ececec', '#e2e2e2'] // used by the audio player
            },
            item: {
                color: '#9e2e09',
                gradient: ['#9e2e09', '#c36846', '#e3a084', '#ffd8c8']
            },
            discography: {
                color: d3.schemeBlues[0],
                gradient: d3.schemeBlues[this.linkTypes.length]
            },
            typeScale: d3.scaleOrdinal(d3.schemeBlues[this.linkTypes.length + 2]).domain(this.linkTypes)
        }

    }


}