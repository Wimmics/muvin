class Menu{
    constructor(data) {
        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('#menu'))

        this.openIcon = `${this.chart.baseUrl}/muvin/images/open.svg`;
        this.closeIcon = `${this.chart.baseUrl}/muvin/images/close.svg`;

        this.legend = new Legend(data)
        this.dataFilter; // TO-DO: create class to handle filters
        this.dataSort; // TO-DO: create class to handle items search
        this.dataSearch = new ItemsSearch(data)
    }

    init() {
        const _this = this;

        this.div.select('#display-items').on('click', function() { _this.chart.updateItemsDisplay(this.checked) } )
            
        this.div.select('#time-button').on('click', () => {
            let dropdown = this.chart.shadowRoot.querySelector("#timeDropdown")
            dropdown.classList.toggle("show")

            let bounding = dropdown.getBoundingClientRect()
            let out = (bounding.left + bounding.width) - window.innerWidth
        
            if (out > 0)
                dropdown.style.left = window.innerWidth - (bounding.left + bounding.width) - 50 + "px"
        })

        // set menu buttons interaction
        this.div.selectAll('div.menu-icon')
            .filter(function() { return this.id != 'about_button'; })
            .on('click', function() {
                _this[this.id.split('_')[0]].open()
            } )

        this.legend.init()
        this.dataSearch.init()
        
    }


    update() {
        this.legend.set()
        this.dataSearch.update()
        // this.search.update()
        // this.filters.updateTimeFilter()
    }


    updateTimeFilter() {
        return;

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

    toggleDisplayItems(value) {
        this.div.select("#display-items").property('checked', value)
    }
}