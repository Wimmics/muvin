class NodesSearch {
    constructor () {
        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('#search-for'))
    }

    init() {
        let eventSource;
        this.div.select("#nodes-input")
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') {
                    if (this.value.length > 2) 
                        _this.updateAutocomplete(this.value.toLowerCase())
                } 
            })

        this.div.select("#search-go")
            .on('click', () => {
                let value = this.div.select("#nodes-input").node().value
                this.loadData(value)
            })

        this.div.select('#search-info').html(`Search for ${this.chart.nodeNature}`)

        this.div.select('#clear-network').on('click', () => { this.chart.data.clear() })

    }

    updateAutocomplete(value) {

        let labels = this.chart.data.getMatchingLabels(value)
 
        d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            .selectAll('option')
            .data(labels)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', e =>  `${e.value} ${e.type ? '(' + e.type + ')' : ''}`)
        
    }

    loadData(value) {
        let node;
        if (this.chart.app === 'crobora') {
            let datalist = d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            let option = datalist.selectAll('option').filter(function() { return this.value === value })
            if (option.size()) node = option.datum()
        } else 
            node = this.chart.data.getNode(value.trim())

        console.log("node = ", node)
        
        if (node)
            this.chart.data.open([node])
        else {
            alert('You must choose an option from the list.')
            return
        }
        
        this.clear()
    }

    hide() {
        this.div.style('display', 'none')
    }

    clear() {
        this.div.select("#nodes-input").node().value = ''
    }
}