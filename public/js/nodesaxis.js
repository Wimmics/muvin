class NodesAxis {
    constructor() {
        this.scale = fisheye.scale(d3.scalePoint) 
        this.tickDistances;
        this.chart = document.querySelector('#muvin')
        this.freeze = false

        this.PLUS = '/muvin/images/plus.svg'
        this.EXPAND = '/muvin/images/expand.svg'
        this.MINIMIZE = '/muvin/images/minimize.svg'
        this.UP = '/muvin/images/up.svg'
        this.DOWN = '/muvin/images/down.svg'

        this.tooltipId = 'node'

        this.slider = d3.select(this.chart.shadowRoot.querySelector('#y-slider'))

        this.distortion = 5;
        this.shift = 0;

        this.color = {focus: '#2C3E50', normal: '#dcdcdc'}

        this.contextmenu = new ContextMenu()
    }

    setDistortionSize(val) {
        this.distortion = val; 
    }

    set() {
        let dimensions = this.chart.getDimensions()

        let chartData = this.chart.getData()
        this.data = chartData.artists
        this.values = chartData.nodes

        let min = this.shift,
            max = dimensions.height - dimensions.top - dimensions.bottom - this.shift;
        this.scale.domain(this.values)
            .range([min, max])
            .padding(.7)
        
        this.defaultScale = d3.scalePoint().domain(this.values).range([min, max]).padding(.7)

        this.slider.style('display', 'block')
        this.setSlider()
        
    }

    async setDistortion(d) {
        
        if (this.values.length === 1 || !d) return

        let distortion = () => new Promise( (resolve, reject) => {
            let pos = this.defaultScale(d)

            let l = this.values.length
            if (l > 3) {
                let shift = this.defaultScale.step(d) * .2
                let index = this.values.indexOf(d)
                let b = Math.trunc(l / 3)
                if (index >= 0 && index < b) {
                    pos -= shift
                } else if (index >= b * 2 && index < l) {
                    pos += shift
                }
            }

            this.scale.distortion(this.focus === d ? 0 : this.distortion).focus(pos)

            this.focus = this.focus == d ? null : d

            d3.selectAll(this.chart.shadowRoot.querySelectorAll('.icon-expand'))
                .attr('xlink:href', e => this.focus === e ? this.MINIMIZE : this.EXPAND)

            this.tickDistances = getTicksDistance(this.scale, this.values)

            resolve()
        })
       
        distortion().then( async () => {
            await this.chart.updateVisibleNodes()
            this.drawLabels()
            this.chart.draw()
        })

       
    }

    setSlider() {
        let dimensions = this.chart.getDimensions()
        let shift = 10, 
            iconsize = 40,
            x = -dimensions.left/2 - iconsize / 2;

        this.slider.attr('transform', `translate(${dimensions.left - shift}, 0)`)

        this.slider.selectAll('image')
            .attr('width', iconsize)
            .attr('height', iconsize)
            .style('cursor', 'pointer')

        this.slider.select("#slider-up")
            .attr('xlink:href', this.UP)
            .attr('transform', `translate(${x}, ${-shift - iconsize / 2})`)
            .on('click', () => {
                let index = this.chart.data.nodes.indexOf(this.chart.getNodeSelection());
                if (index === 0) return;
                this.setDistortion(this.chart.data.nodes[index - 1])
            })

        this.slider.select('#slider-down')
            .attr('xlink:href', this.DOWN)
            .attr('transform', `translate(${x}, ${dimensions.height - dimensions.bottom - dimensions.top - shift})`)
            .on('click', () => {
                let index = this.chart.data.nodes.indexOf(this.chart.getNodeSelection());
                if (index === this.chart.data.nodes.length - 1) return;
                this.setDistortion(this.chart.data.nodes[index + 1])
            })

    }

    setRange() {
        let point = this.scale(this.chart.data.nodes[0])
        this.rangePoints = this.tickDistances.map(d => { let v = point; point += d; return v; })
    }

    invert(pos, dir){
        let index = d3.bisect(this.rangePoints, pos) - (Math.sign(dir) > 0 ? 1 : 0)
        return index >= this.values.length ? this.values[this.values.length - 1] : this.values[index];
    }

    drawLabels() {
        const _this = this;
        let dimensions = this.chart.getDimensions()
        
        let rectwidth = dimensions.left * .7
        let rectheight = 30
        let iconsize = 15

        let getFontSize = (d, l) => { // font size changes according to whether the node is focused on or not
            
            if (!this.focus || (this.focus && this.chart.areItemsVisible(d))) return '1em'
            else if (this.focus && this.focus != d) return '.5em'

            let direction = this.values.indexOf(d) - this.values.indexOf(this.focus)
            let pos = this.scale(d), 
                focusPos = this.scale(this.focus) + Math.sign(direction) * this.getStep(this.focus) ;

            let p = pos > focusPos ? focusPos / pos : pos / focusPos;
            return Math.min( (rectwidth * .8) / l, .8) * p  + "em"
        }

        let group = d3.select(this.chart.shadowRoot.querySelector('#labels-group'))
        group.selectAll('g.artist-label')
            .data(this.values)
            .join(
                enter => enter.append('g')
                    .classed('artist-label', true)
                    .style('cursor', 'pointer')

                    .call(g => g.append('rect')
                        .attr('fill', d => this.focus === d ? this.color.focus : this.color.normal)
                        .attr('rx', 15)
                        .attr('width', rectwidth)
                        .attr('height', rectheight)
                        .attr('x', rectwidth * -.05)
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none')
                        .on('click', d => this.setDistortion(d))
                        .on('mouseover', d => { let e = d3.event; this.mouseover(e, d) })
                        .on('mouseout', () => this.mouseout())
                    )

                    .call(g => g.append('text')
                        .text(d => d)
                        .attr('class', 'title')
                        .style('font-weight', 'bold')
                        .style('font-size', function(d) { return getFontSize(d, this.getComputedTextLength())})
                        .style('text-anchor', 'middle')
                        .attr('x', (rectwidth -(rectwidth * .05)) / 2)
                        .attr('y', '1.2em')
                        .attr('fill', d => this.focus === d ? '#fff' : '#000')
                        .style('pointer-events', 'none')
                        )
                        

                    .call(g => g.append('svg:image')
                        .attr('xlink:href', this.PLUS)
                        .attr('class', 'circle-plus')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', rectwidth)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNetworkMenu(d)))
                        .on('contextmenu', d3.contextMenu(d => this.contextmenu.getNodeMenu()))
                        .call(image => image.append('title').text('Click to get more options'))) 
                        ,

                update => update.call(g => g.select('text.title').text(d => d))
                    .call(g => g.select('.circle-plus')
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNetworkMenu(d))))
                        .on('contextmenu', d3.contextMenu(d => this.contextmenu.getNodeMenu()))
                    .call(g => g.select('rect').transition().duration(500)
                        .attr('fill', d => this.focus === d ? this.color.focus : this.color.normal)
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none'))
                    .call(g => g.select('text').transition().duration(500)  
                        .attr('fill', d => this.focus === d ? '#fff' : '#000')
                        .style('font-size', function(d) { return getFontSize(d, this.getComputedTextLength())})
                        ),

                exit => exit.remove()
            )
            .call(g => g.transition().duration(500)
                .attr('transform', d => {
                    let y = this.scale(d) - rectheight / 2
                    y = y < this.shift ? this.shift : y;
                    return `translate(10, ${y})`
                }))

            group.selectAll('text').each(function() { d3.select(this).call(wrap, rectwidth) })

            group.selectAll('rect')
                .call(rect => rect.attr("height", function() { 
                    let siblingChildren = d3.select(this.nextElementSibling).selectAll('tspan').size()
                    return siblingChildren > 1 ? siblingChildren * rectheight * .7 : rectheight
                }) )
                
    }

    getTooltipContent(d) {
        let value = this.data[d]
        let type = (value.type === 'Group' ? 'Creation' : 'Birth') + ' Date:'
        let deathInfo = value.lifespan.to ? `<b>${value.type === 'Group' ? 'Dissolution' : 'Death'} Date:</b> ${value.lifespan.to}\n` : ''
        let groupInfo = value.type === 'Group' ? `<b>Members:</b><br> ${value.members.map(e => e.name).join('<br>')}` : ''
        
        return `<b>${value.name}</b><br>
            <b>${type}</b> ${value.lifespan.from}<br>
            ${deathInfo}${groupInfo}`
    }

    setFreeze(d) {
        this.freeze = null
        this.setHighlight(d)
        this.freeze = d
    }

    mouseover(e, d) {
        if (this.chart.app === 'wasabi') {
            this.chart.tooltip.setContent(this.getTooltipContent(d), this.tooltipId)
            this.chart.tooltip.show(e, this.tooltipId)
        }

        this.setHighlight(d)
    }

    mouseout(){
        this.chart.tooltip.hide(this.tooltipId)
        this.removeHighlight()
    }

    releaseFreeze(){
        this.freeze = null
        this.removeHighlight()
    }

    setHighlight(d) {
        // do nothing when the links of a node are highlighted, or if the node is not on focus, or if the player is active
        if (this.freeze || this.values.length === 1) return;
                
        let group = d3.select(this.chart.shadowRoot.querySelector('#chart-group'))

        let linkElem = group.selectAll('g.link')
            .transition()
            .duration(500)
            .attr('opacity', e => e.source === d || e.target === d ? 1 : 0)

        group.selectAll("[class$='-ticks']")
            .attr('opacity', e => e.source === d || e.target === d ? 1 : 0)

        linkElem.selectAll('line')
            .attr('stroke-width', 2)

        let nodes = this.chart.getConnectedNodes(d)

        group.selectAll('g.artist')
            .transition('focus-artist')
            .duration(500)
            .attr('opacity', e => d === e || nodes.fst.includes(e) ? 1 : .1)

        group.selectAll('.item-circle')
            .filter(e => this.chart.areItemsVisible(e.artist.name))
            .transition('focus-items')
            .duration(500)
            .attr('opacity', e => nodes.snd.includes(e.id) ? 1 : .1)
            .attr('stroke-dasharray', e => nodes.snd.includes(e.id) && this.chart.isUncertain(e) ? 4 : 'none')

        if (this.chart.getTimeSelection())
            group.selectAll('.node-link')
                .transition('focus-links')
                .duration(500)
                .attr('opacity', e => e.sourceArtist === d || e.targetArtist === d ? 1 : 0)

        this.chart.profiles.downplay(d)
    
    }

    removeHighlight() {
        if (this.freeze || this.values.length === 1) return;

        let group = d3.select(this.chart.shadowRoot.querySelector('#chart-group'))

        this.chart.fstlinks.reverse()

        this.chart.nodes.reverse()
        
        group.selectAll('g.artist')
            .transition('unfocus-artist')
            .duration(500)
            .attr('opacity', 1)

        group.selectAll('.node-link')
            .attr('opacity', this.chart.getTimeSelection() ? 1 : 0)

        this.chart.profiles.reverseDownplay()
    }

    getStep(value) {
        return this.tickDistances ? this.tickDistances[this.values.indexOf(value)] : this.scale.step()
    }
}