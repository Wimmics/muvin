import * as d3 from 'd3'

class ViewSettings{
    constructor(chart) {
        this.chart = chart
    }

    set() {
        const _this = this
        this.displayItemsCheckbox = this.chart.shadowRoot.querySelector('#display-items')

        d3.select(this.displayItemsCheckbox).on('click', function() { 
                _this.chart.updateItemsDisplay(this.checked) 
            } )

        const clearNetworkButton = this.chart.shadowRoot.querySelector('#clear-network')    
        d3.select(clearNetworkButton)
            .on('click', async () => await this.handleClearNetwork())
    }
    
    async handleClearNetwork() {
        await this.chart.data.clear()
        this.chart.clear()
        //window.open(window.href, "_self") 
    }

    toggleDisplayItems(value) {
        d3.select(this.displayItemsCheckbox).property('checked', value)
    }
}

export default ViewSettings