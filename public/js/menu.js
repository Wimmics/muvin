class Menu{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('.menu'))

        this.isOpen = false;

        this.width = 200;

        this.openIcon = '/muvin/images/open.svg';
        this.closeIcon = '/muvin/images/close.svg';
    }

    init() {
        const _this = this;
        let eventSource;   

        this.div.select("#nodes-input")
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') {
                    if (this.value.length > 2) 
                        _this.updateAutocomplete(this.value.toLowerCase())
                } else {
                    
                    let value = this.value
                    let node = d3.select(this.list).selectAll('option').filter(function() { return this.value === value }).datum()
                    
                    _this.chart.data.add(node)
                    _this.clearSearch()
                }
            })
        

        this.div.select('#items-input')
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.chart.nodes.highlightItem(this.value)
            })

        this.div.select('#items-input-clear').on('click', () => this.chart.nodes.clearHighlight())

        this.div.select('#toggle-best-of')
            .on('change', function() { _this.chart.toggleBestOf(this.checked) })

        this.div.selectAll('.menu-icon')
            .on('click', () => this.toggle())
             
    }

    clearSearch() {
        this.div.select("#nodes-input").node().value = ''
    }

    updateItemsSearch() {
        this.data = this.chart.data.getItems()

        let songNames = this.data.map(d => d.name)
        songNames = songNames.filter((d,i) => songNames.indexOf(d) === i)
        songNames.sort((a,b) => a.localeCompare(b))

        d3.select(this.chart.shadowRoot.querySelector('#items-list'))
            .selectAll('option')
            .data(songNames)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d)
    
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
    
    displayViewSettings() {
        this.div.select('#view-controls').style('display', 'block')
    }

    hideViewSettings() {
        this.div.select('#view-controls').style('display', 'none')
    }

    setWidth(val) {
        this.div.style('width', val + 'px')
    }
}