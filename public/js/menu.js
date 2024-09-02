class Menu{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('.menu'))

        this.isOpen = false;

        this.width = 200;

        this.openIcon = `${this.chart.baseUrl}/muvin/images/open.svg`;
        this.closeIcon = `${this.chart.baseUrl}/muvin/images/close.svg`;
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
                } 
                // else {
                //     _this.loadData(this.value)
                // }
            })

        this.div.select("#search-go")
            .on('click', () => {
                let value = this.div.select("#nodes-input").node().value
                this.loadData(value)
            })
        

        this.div.select('#items-input')
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.chart.nodes.highlightItem(this.value)
            })

        this.div.select('#items-input-clear').on('click', () => this.chart.nodes.clearHighlight())

        this.div.select('#clear-network').on('click', async () => await this.handleClearNetwork())

        this.div.select('#clear-cache').on('click', async () => await this.handleClearCache())

        this.div.select('#display-items').on('click', function() { _this.chart.updateItemsDisplay(this.checked) } )
            
        this.div.select('#time-button').on('click', () => {
            let dropdown = this.chart.shadowRoot.querySelector("#timeDropdown")
            dropdown.classList.toggle("show")

            let bounding = dropdown.getBoundingClientRect()
            let out = (bounding.left + bounding.width) - window.innerWidth
        
            if (out > 0)
                dropdown.style.left = window.innerWidth - (bounding.left + bounding.width) - 50 + "px"
        })
    }

    async handleClearCache() {
        let body = { hashCode: this.chart.hashCode }
       
        try {
            let res =  await fetch(`${this.chart.baseUrl}/muvin/clearcache/${this.chart.app}`, { 
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body) 
            })
            console.log("res = ", res)
            

            if (res.status === 200)
                Swal.fire({
                    toast: true,               // Enable toast mode
                    position: 'top-end',       // Position the toast in the top right corner
                    icon: 'success',           // Type of icon (success, error, info, warning)
                    title: 'Cache cleared', // Title of the toast
                    showConfirmButton: false,  // Hide the confirm button
                    timer: 3000,               // Duration in milliseconds (3000ms = 3 seconds)
                    timerProgressBar: true,    // Show a progress bar indicating the timer
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer); // Pause the timer on hover
                        toast.addEventListener('mouseleave', Swal.resumeTimer); // Resume the timer when the mouse leaves
                    }
                })
            

        } catch (e) {
            alert(`An error occurred: ${e.message}. Please try again later.`)
        }
    }

    async handleClearNetwork() {
        await this.chart.data.clear()

        window.open(this.chart.url, "_self") 
    }

    loadData(value) {
        let node;
        if (this.chart.app === 'crobora') {
            let datalist = d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            let option = datalist.selectAll('option').filter(function() { return this.value === value })
            if (option.size()) node = option.datum()
        } else 
            node = this.chart.data.getNode(value.trim())
        
        if (node)
            this.chart.data.load([node])
        else {
            alert('You must choose an option from the list.')
            return
        }
        
        
        this.clearSearch()
    }

    hideSearchFor() {
        this.div.select('#clear-network').style('display', 'none')
        this.div.select('#search-for').style('display', 'none')
    }

    clearSearch() {
        this.div.select("#nodes-input").node().value = ''
    }

    updateItemsSearch() {
        this.data = this.chart.data.getItems()

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
            lowerLabel = this.chart.shadowRoot.querySelector('#from-label'),
            upperLabel = this.chart.shadowRoot.querySelector('#to-label');

        lowerLabel.innerHTML = min
        upperLabel.innerHTML = max


        d3.select(this.chart.shadowRoot.querySelector('#lower'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', min)
            .on('input', () => {
                let lowerVal = parseInt(lowerSlider.value);
                let upperVal = parseInt(upperSlider.value);
                
                if (lowerVal > upperVal - 4) {
                    upperSlider.value = lowerVal + 4;
                    
                    if (upperVal == upperSlider.max) {
                        lowerSlider.value = parseInt(upperSlider.max) - 4;
                    }
                }

                applyFilters()
            })

        d3.select(this.chart.shadowRoot.querySelector('#upper'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', max)
            .on('input', () => {
                let lowerVal = parseInt(lowerSlider.value);
                let upperVal = parseInt(upperSlider.value);
                
                if (upperVal < lowerVal + 4) {
                    lowerSlider.value = upperVal - 4;
                    
                    if (lowerVal == lowerSlider.min) {
                        upperSlider.value = parseInt(lowerSlider.min) + 4;
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

    toggleDisplayItems(value) {
        this.div.select("#display-items").property('checked', value)
    }
}