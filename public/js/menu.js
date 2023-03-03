class Menu{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('.menu'))

        this.isOpen = false;

        this.width = 200;

        this.openIcon = '/muvin/images/open.svg';
        this.closeIcon = '/muvin/images/close.svg';

        this.search = new Search()

    }

    init() {
        const _this = this;
        this.search.init()

        this.div.select('#toggle-best-of')
            .on('change', function() { _this.chart.toggleBestOf(this.checked) })

        this.div.selectAll('.menu-icon')
            .on('click', () => this.toggle())

        this.div.select("select#dataset-list")
            .on('change', function() { 
                _this.changeDataset(this.value)
             })
    }

    changeDataset(value) {
        this.hideViewSettings()
        this.chart.shadowRoot.querySelector('#nodes-input').value = ''

        d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            .selectAll('option')
            .remove()

        this.chart.setAttribute('app', value)
        this.chart.data.clear()
        this.chart.data.getNodesLabels(value)
    }
    
    displayViewSettings() {
        this.div.select('#view-controls').style('display', 'block')

        this.div.select('#best-of').style('display', this.chart.getAttribute('wasabi') ? 'block' : 'none')
    }

    hideViewSettings() {
        this.div.select('#view-controls').style('display', 'none')

        this.div.select('#best-of').style('display', 'none')
    }

    open() {

        this.div.select('#menu-icon')
            .attr('src', this.closeIcon)
            .transition().duration(500)
            .style('left', this.width - 30 + "px")

        this.div.style('width', this.width + 'px')

        this.div.select('.settings').style('display', 'flex')
        this.div.select('.icon-container').style('display', 'none')

    }

    close() {
        this.div.select('#menu-icon')
            .attr('src', this.openIcon)
            .transition().duration(500)
            .style('left', "10px")

        this.div.style('width', '40px')

        this.div.select('.settings').style('display', 'none')
        this.div.select('.icon-container').style('display', 'flex')
        
    }

    toggle() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) this.open();
        else this.close()
    }
}