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
                } else _this.chart.data.add(this.value)
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

    updateItemsSearch(data) {
        this.data = data

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

        let labels = this.chart.data.nodeLabels.filter(d => d.name.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.name.value.localeCompare(b.name.value))
 
        d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            .selectAll('option')
            .data(labels)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d.name.value)
        
    }
    
    displayViewSettings() {
        this.div.select('#view-controls').style('display', 'block')
    }

    hideViewSettings() {
        this.div.select('#view-controls').style('display', 'none')
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