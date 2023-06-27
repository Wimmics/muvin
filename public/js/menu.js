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

    updateTimeFilter() {

        const _this = this;

        const applyFilters = () => {
            lowerLabel.innerHTML = +lowerSlider.value
            upperLabel.innerHTML = +upperSlider.value

            this.chart.data.updateFilters('timeTo', +upperSlider.value)
            this.chart.data.updateFilters('timeFrom', +lowerSlider.value)
            this.chart.update()
        }

        let extent = d3.extent(this.chart.data.getAllDates())
        let min = this.chart.data.getFiltersByType('timeFrom'),
            max = this.chart.data.getFiltersByType('timeTo');

        let lowerSlider = this.chart.shadowRoot.querySelector('#lower'),
            upperSlider = this.chart.shadowRoot.querySelector('#upper'),
            lowerVal = parseInt(lowerSlider.value),
            upperVal = parseInt(upperSlider.value),
            lowerLabel = this.chart.shadowRoot.querySelector('#from-label'),
            upperLabel = this.chart.shadowRoot.querySelector('#to-label');

        lowerLabel.innerHTML = min
        upperLabel.innerHTML = max

        d3.select(this.chart.shadowRoot.querySelector('#upper'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', max)
            .on('input', () => {
                lowerVal = parseInt(lowerSlider.value);
                upperVal = parseInt(upperSlider.value);
                
                if (upperVal < lowerVal + 4) {
                    lowerSlider.value = upperVal - 4;
                    
                    if (lowerVal == lowerSlider.min) {
                        upperSlider.value = 4;
                    }
                }

                applyFilters()
            
            })

        d3.select(this.chart.shadowRoot.querySelector('#lower'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', min)
            .on('input', () => {
                lowerVal = parseInt(lowerSlider.value);
                upperVal = parseInt(upperSlider.value);
                
                if (lowerVal > upperVal - 4) {
                    upperSlider.value = lowerVal + 4;
                    
                    if (upperVal == upperSlider.max) {
                        lowerSlider.value = parseInt(upperSlider.max) - 4;
                    }
                }

                applyFilters()
            })

        

        
            
    }
    
    displayViewSettings() {
        this.div.select('#view-options').style('display', 'flex')
    }

    hideViewSettings() {
        this.div.select('#view-options').style('display', 'none')
    }

    setWidth(val) {
        this.div.style('width', val + 'px')
    }
}