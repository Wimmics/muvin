class TimeAxis{
    constructor() {
        this.scale = fisheye.scale(d3.scalePoint)
        this.tickDistances;
        this.chart = document.querySelector('#muvin')

        this.slider = d3.select(this.chart.shadowRoot.querySelector('#x-slider'))

        this.distortion = 15
    }

    set() {
      
        this.values = this.chart.getData().dates

        let dimensions = this.chart.getDimensions()

        this.scale.domain(this.values)
            .range([dimensions.left, dimensions.width - dimensions.right])
            .padding(.5)

        this.bottomAxis = d3.axisBottom()
            .ticks(this.values.length)
            .tickFormat(d => d.toString())
            .scale(this.scale)
        
        this.topAxis = d3.axisTop()
            .ticks(this.values.length)
            .tickFormat(d => d.toString())
            .scale(this.scale)

        d3.select(this.chart.shadowRoot.querySelector('#bottom-axis'))
            .attr('transform', `translate(0, ${dimensions.height - dimensions.bottom - dimensions.top})`)
            .style('cursor', 'pointer')
            .call(this.bottomAxis)
            .selectAll(".tick text")
            .on('click', d => this.setDistortion(d))

        d3.select(this.chart.shadowRoot.querySelector('#top-axis'))
            .style('cursor', 'pointer')
            .call(this.topAxis)       
            .selectAll(".tick text")
            .on('click', d => this.setDistortion(d))

        this.tickDistances = getTicksDistance(this.scale, this.values)
        this.setRange();

        this.defaultScale = d3.scalePoint().domain(this.values).range([dimensions.left, dimensions.width - dimensions.right]).padding(.5)

        this.setSlider()
    }

    getStep(value) {
        return this.tickDistances ? this.tickDistances[this.values.indexOf(value)] : this.scale.step()
    }

    getItemsByTime(value) {
        let itemsPerYear = this.chart.profiles.data.map(e => e.data[0].map(x => x.data)).flat()

        itemsPerYear = d3.nest()
            .key(e => e.year)
            .entries(itemsPerYear)

        return itemsPerYear.find(e => e.key === value)
        
    }

    async setDistortion(d) {
        this.chart.sndlinks.hide()

        let res = this.getItemsByTime(d)
        let values = res ? res.values : []

        if (d3.sum(values.filter(e => this.chart.getNodeSelection() ? this.chart.isSelected(e.artist) && e.year === d : e.year === d), e => e.values.length) === 0) return;

        d3.select(this.chart.shadowRoot.querySelector("#group-chart")).selectAll('.node-link').attr('opacity', 0)
        
        this.scale.distortion(this.focus === d ? 0 : this.distortion).focus(this.defaultScale(d))
    
        d3.select(this.chart.shadowRoot.querySelector("g#bottom-axis"))
            .transition()
            .duration(500)
            .call(this.bottomAxis);

        d3.select(this.chart.shadowRoot.querySelector("g#top-axis"))
            .transition().duration(500)
            .call(this.topAxis);

        this.tickDistances = getTicksDistance(this.scale, this.values)
        this.focus = this.focus === d ? null : d

        this.setRange()

        this.setSliderPosition(this.defaultScale(d) - this.getStep(d) / 2, d)

        this.chart.draw()
    }

    setRange() {
        let point = this.scale.range()[0]
        this.rangePoints = this.tickDistances.map(d => { let v = point; point += d; return v; })
    }

    setSliderPosition(pos, year) {
        let width = d3.max([this.getStep(year), 20])
        let slider = this.slider.selectAll('rect.move')

        this.slider.select('text').text(year).attr('transform', `translate(${pos + width/2}, 7)`)

        slider.attr('x', pos).attr('width', width)
    }

    setSlider() {

        // let sliderSelector = d3.select(this.chart.shadowRoot.querySelector('#x-slider'))
        let dimensions = this.chart.getDimensions()

        let selectedYear, xPos;

        const dragBehavior = d => {
            this.chart.sndlinks.hide()
            if (this.focus && this.focus != selectedYear) 
                this.setDistortion(selectedYear)
            else if (d3.event.type == 'drag') // to avoid change the position on click (start)
                this.setSliderPosition(xPos, selectedYear)

            this.setSliderAnimation(selectedYear) 
        }

        let drag = d3.drag()
            .on('start', () => dragBehavior())
            .on('drag', () => {
                let direction = xPos - d3.event.x
                xPos = d3.event.x

                let lastIndex = this.tickDistances.length - 1
                let rightmostpos = dimensions.width - dimensions.right - this.tickDistances[lastIndex]
                xPos = xPos <= dimensions.left ? dimensions.left : xPos
                xPos = xPos >= rightmostpos ? rightmostpos : xPos

                selectedYear = this.invert(xPos, direction)

                dragBehavior()
            }).on('end', () => {
                
                this.setSliderPosition(this.scale(selectedYear) - this.getStep(selectedYear)/ 2, selectedYear)
                
                this.clearSliderAnimation()
            })

        this.slider.select('.marker')
            .attr('width', this.scale.step())
            .attr('height', dimensions.height - 10 - dimensions.bottom - dimensions.top)
            .attr('y', 0)
            .attr('x', dimensions.left)
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            
        this.slider.selectAll('.slider-button')
            .attr('width', this.scale.step())
            .style('display', 'block')        

        this.slider.select('#top-button')
            .attr('height', 15)
            .attr('x', dimensions.left)
            .attr('y', -5)
            .call(drag)

        this.slider.select('#bottom-button')
            .attr('height', 15)
            .attr('x', dimensions.left)
            .attr('y', dimensions.height - 10 - dimensions.bottom - dimensions.top)
            .call(drag)

        this.slider.select('text')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .text('')
    }

    invert(pos, dir){
        
        let index = d3.bisect(this.rangePoints, pos) - (Math.sign(dir) > 0 ? 1 : 0)
                
        return index >= this.values.length ? this.values[this.values.length - 1] : this.values[index] 
    }

    clearSliderAnimation() {
        this.chart.nodes.reverse()
    }

    setSliderAnimation(value) {

        if (this.chart.isFreezeActive()) return

        this.chart.group.selectAll('.item-circle')
            .transition()
            .duration(100)
            .attr('opacity', d => {
                let artist = d.artist.name 
                
                if (d.year === this.focus) return 1
                if (!this.chart.isNodeVisible(artist)) return 0 // hide when the items of the artist are hidden
                if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(artist)) return 0 // hide when the artist is not the one with the focus on
                if (d.year != value) return 0
                return 1
            })  

        this.chart.fstlinks.hideLabels()
    }


}