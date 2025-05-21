import * as d3 from 'd3'

class TimeSlider {
    constructor(chart) {
        this.chart = chart

        this.lowerSlider = this.chart.shadowRoot.querySelector('#lower')
        this.upperSlider = this.chart.shadowRoot.querySelector('#upper')
        this.lowerLabel = this.chart.shadowRoot.querySelector('#lower-value')
        this.upperLabel = this.chart.shadowRoot.querySelector('#upper-value')
    }

    // Function to update dynamic labels and their positions
    updateLabels() {
        const range = this.lowerSlider.max - this.lowerSlider.min;
    
        const sliderRect = this.lowerSlider.getBoundingClientRect();
        const sliderWidth = sliderRect.width;
    
        const lowerPercent = (this.lowerSlider.value - this.lowerSlider.min) / range;
        const upperPercent = (this.upperSlider.value - this.upperSlider.min) / range;
    
        const lowerPx = this.lowerSlider.offsetLeft + lowerPercent * sliderWidth;
        const upperPx = this.upperSlider.offsetLeft + upperPercent * sliderWidth;
    
        this.lowerLabel.textContent = this.lowerSlider.value;
        this.upperLabel.textContent = this.upperSlider.value;
    
        this.lowerLabel.style.left = `${lowerPx}px`;
        this.upperLabel.style.left = `${upperPx}px`;
    }

    async applyFilters() {
        this.updateLabels()

        this.chart.data.updateFilters('timeTo', +this.upperSlider.value)
        this.chart.data.updateFilters('timeFrom', +this.lowerSlider.value)
        await this.chart.data.updateTime()
        this.chart.update()
    }

    update() {

        let extent = d3.extent(this.chart.data.getAllDates())
        let min = this.chart.data.getFiltersByType('timeFrom'),
            max = this.chart.data.getFiltersByType('timeTo');


        this.chart.shadowRoot.querySelector('#from-label').textContent = extent[0]
        this.chart.shadowRoot.querySelector('#to-label').textContent = extent[1]

        d3.select(this.chart.shadowRoot.querySelector('#lower'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', min)
            .on('input', () => {
                let lowerVal = parseInt(this.lowerSlider.value);
                let upperVal = parseInt(this.upperSlider.value);
                
                if (lowerVal > upperVal - 4) {
                    this.upperSlider.value = lowerVal + 4;
                    
                    if (upperVal == this.upperSlider.max) {
                        this.lowerSlider.value = parseInt(this.upperSlider.max) - 4;
                    }
                }

                this.applyFilters()
            })

        d3.select(this.chart.shadowRoot.querySelector('#upper'))
            .attr('min', extent[0])
            .attr('max', extent[1])
            .attr('value', max)
            .on('input', () => {
                let lowerVal = parseInt(this.lowerSlider.value);
                let upperVal = parseInt(this.upperSlider.value);
                
                if (upperVal < lowerVal + 4) {
                    this.lowerSlider.value = upperVal - 4;
                    
                    if (lowerVal == this.lowerSlider.min) {
                        this.upperSlider.value = parseInt(this.lowerSlider.min) + 4;
                    }
                }

                this.applyFilters()
            
            })

        // wait for next paint to ensure all styles are applied
        requestAnimationFrame(() => this.updateLabels());
            
    }

}

export default TimeSlider