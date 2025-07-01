import * as d3 from 'd3'

class Search{
    constructor(chart) {
        this.chart = chart
        this.searchInput = this.chart.shadowRoot.querySelector("#ul-search")
    }

    set() {
        let eventSource;
        const _this = this;
        
        d3.select(this.searchInput)
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.chart.nodes.highlightItem(this.value)
            })

        let clearButton = this.chart.shadowRoot.querySelector("#items-input-clear")
        d3.select(clearButton).on('click', () => { 
            this.chart.nodes.clearHighlight()
            this.clear()
        })
    }

    clear() {
        this.searchInput.value = ''
    }

    async update() {
        this.data = await this.chart.data.getItems()

        let itemNames = this.data.map(d => d.title)
        itemNames = itemNames.filter((d,i) => itemNames.indexOf(d) === i)
        itemNames.sort((a,b) => a.localeCompare(b))

        d3.select(this.chart.shadowRoot.querySelector('#items-list'))
            .selectAll('option')
            .data(itemNames)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d)
    
    }

}

export default Search