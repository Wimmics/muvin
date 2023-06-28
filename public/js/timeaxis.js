class TimeAxis{
    constructor() {
        //this.scale = fisheye.scale(d3.scalePoint)

        this.timeScale = new TimeScale()
        this.tickDistances;
        this.chart = document.querySelector('#muvin')

        this.slider = d3.select(this.chart.shadowRoot.querySelector('#x-slider'))


        this.focus = []
    }

    async set() {
      
        this.values = this.chart.data.getDates()

        let dimensions = this.chart.getDimensions()

        let step = (dimensions.width - dimensions.left) / this.values.length
        
        let focusStep = Math.min(step * 5, 700)

        this.timeScale.setDomain(this.values)
        this.timeScale.setStep(step)
        this.timeScale.setFocusLength(focusStep)
        this.timeScale.setStartingPos(dimensions.left)
        await this.timeScale.setMapping()
    }

    drawLabels() {
        let dimensions = this.chart.getDimensions()
        
        let top = d3.select(this.chart.shadowRoot.querySelector('#top-axis'))
            .style('cursor', 'pointer')
            
        top.selectAll('text')
            .data(this.values)
            .join(
                enter => enter.append('text')
                    .style('text-anchor', 'middle'),
                update => update,
                exit => exit.remove()                            
            )
            .text(d => d)
            .attr('x', d => this.scale(d) + this.step(d) / 2)

        top.select('line')
            .attr('x1', dimensions.left)
            .attr('x2', this.range()[1])
            .attr('y1', 12)
            .attr('y2', 12)
            .attr('stroke', '#000')

        let bottom = d3.select(this.chart.shadowRoot.querySelector('#bottom-axis'))
            .style('cursor', 'pointer')
            
        bottom.selectAll('text')
            .data(this.values)
            .join(
                enter => enter.append('text')
                    .style('text-anchor', 'middle'),
                update => update,
                exit => exit.remove()                            
            )
            .text(d => d)
            .attr('x', d => this.scale(d) + this.step(d) / 2)
            .attr('y', dimensions.height - dimensions.bottom)
            
        bottom.select('line')
            .attr('x1', dimensions.left)
            .attr('x2', this.range()[1])
            .attr('y1', dimensions.height - dimensions.bottom - 20)
            .attr('y2', dimensions.height - dimensions.bottom - 20)
            .attr('stroke', '#000')

        this.chart.group.selectAll('g.timeaxis')
            .selectAll('text')
            .on('click', async (d) => {
                await this.computeDistortion(d)
                this.setDistortion()
            })    
    }

   
    getItemsByTime(value) {
        let itemsPerYear = this.chart.profiles.data.map(e => e.data[0].map(x => x.data)).flat() // review this !

        itemsPerYear = d3.nest()
            .key(e => e.year)
            .entries(itemsPerYear)

        return itemsPerYear.find(e => +e.key === value)
    }

    async computeDistortion(d) {
        
        let res = this.getItemsByTime(d)
        let values = res ? res.values : []
       
        if (d3.sum(values.filter(e => this.chart.getNodeSelection() ? this.chart.isSelected(e.node) && e.year === d : e.year === d), e => e.values.length) === 0) return;

        let index = this.focus.indexOf(d)
        if (index !== -1) this.focus.splice(index, 1)
        else this.focus.push(d)
        
        await this.timeScale.setDistortion(d)
    }

    setDistortion() {

        this.chart.sndlinks.hide()        
        
        this.drawLabels()

        this.chart.draw()
    }


    clearFocus() {
        this.focus = []
    }

    setSliderPosition(pos, year) {
        if (!year) return;
       
        let width = d3.max([this.step(year), 20])
        let slider = this.slider.selectAll('rect.move')

        slider.attr('x', pos).attr('width', width)
    }

    drawSlider() {

        let dimensions = this.chart.getDimensions()

        let selectedYear, xPos;

        const dragBehavior = async (year) => {
            if (year === selectedYear) return;
            selectedYear = year // update the current year on focus

            this.chart.sndlinks.hide()
            if (!this.focus.includes(selectedYear)) {
                await this.computeDistortion(selectedYear)
                this.setDistortion()
            }
            else if (d3.event.type == 'drag') // to avoid change the position on click (start)
                this.setSliderPosition(xPos, selectedYear)

            this.setSliderAnimation(selectedYear) 
        }

        let drag = d3.drag()
            .on('start', () => dragBehavior(selectedYear))
            .on('drag', () => {
                let direction = xPos - d3.event.x
                xPos = d3.event.x

                let rightmostpos = this.scale(this.values[this.values.length - 1]) //dimensions.width - dimensions.right - this.tickDistances[lastIndex]
                xPos = xPos <= dimensions.left ? dimensions.left : xPos
                xPos = xPos >= rightmostpos ? rightmostpos : xPos

                let year = this.invert(xPos)

                //dragBehavior(year)
                this.setSliderPosition(xPos, year)
                this.setSliderAnimation(year) 
            }).on('end', () => {
                
                this.setSliderPosition(this.scale(selectedYear) - this.step(selectedYear)/ 2, selectedYear)
                
                this.clearSliderAnimation()
            })

        this.slider.select('.marker')
            .attr('width', this.step())
            .attr('height', dimensions.height - 10 - dimensions.bottom - dimensions.top)
            .attr('x', dimensions.left)
            .attr('y', 8)
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            
        this.slider.selectAll('.slider-button')
            .attr('width', this.step())
            .style('display', 'block')        

        this.slider.select('#top-button')
            .attr('height', 15)
            .attr('y', 8)
            .attr('x', dimensions.left)
            .call(drag)

        this.slider.select('#bottom-button')
            .attr('height', 15)
            .attr('x', dimensions.left)
            .attr('y', dimensions.height - 2 - dimensions.bottom - dimensions.top)
            .call(drag)

    }


    clearSliderAnimation() {
        this.chart.nodes.reverse()
    }

    setSliderAnimation(value) {

        if (this.chart.isFreezeActive()) return

        this.chart.group.selectAll('.item-circle')
            .attr('opacity', d => {
                if (this.focus.includes(d.year)) return 1
                if (!this.chart.isNodeVisible(d.node.key)) return 0 // hide when the items of the artist are hidden
                if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(d.node.key)) return 0 // hide when the artist is not the one with the focus on
                if (d.year != value) return 0
                return 1
            })  

        this.chart.fstlinks.hideLabels()
    }

    

    // The methods below create a facade to TimeScale through common methods of d3 scales
    scale(d) {
        return this.timeScale.getPos(d)
    }

    step(d) {
        return this.timeScale.getStep(d)
    }

    invert(pos) {
        return this.timeScale.getValue(pos)
    }

    range() {
        return this.timeScale.getRange()
    }

}