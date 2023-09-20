class NodesAxis {
    constructor() {
        this.scale = fisheye.scale(d3.scalePoint) 

        
        this.tickDistances;
        this.chart = document.querySelector('#muvin')
        this.div = d3.select(this.chart.shadowRoot.querySelector('.nodes-panel'))

        this.freeze = false

        this.SETTINGS = `${this.chart.baseUrl}/muvin/images/settings.svg`
        this.NETWORK = `${this.chart.baseUrl}/muvin/images/network.svg`

        this.EXPAND = `${this.chart.baseUrl}/muvin/images/expand.svg`
        this.MINIMIZE = `${this.chart.baseUrl}/muvin/images/minimize.svg`
        this.UP = `${this.chart.baseUrl}/muvin/images/up.svg`
        this.DOWN = `${this.chart.baseUrl}/muvin/images/down.svg`

        this.tooltipId = 'node'

        this.slider = d3.select(this.chart.shadowRoot.querySelector('#y-slider'))

        this.distortion = 4;
        this.shift = 0;

        this.color = {focus: '#2C3E50', normal: '#dcdcdc'}

        this.contextmenu = new ContextMenu()
    }

    set() {
        let dimensions = this.chart.getDimensions()

        this.data = this.chart.data.getNodes()
        this.values = this.chart.data.getNodesKeys()

        this.min = this.shift
        this.max = dimensions.height - dimensions.top - dimensions.bottom - this.shift;

        this.svg = this.div.select('svg')
            .attr('width', dimensions.left)
            .attr('height', dimensions.height)

        this.scale.domain(this.values)
            .range([this.min, this.max])
            .padding(.7)
        
        this.defaultScale = d3.scalePoint().domain(this.values).range([this.min, this.max]).padding(.7)

        this.svg.select('text')
            .attr('transform', `translate(10, 28)`)
            
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

        this.slider.attr('transform', `translate(${dimensions.left - shift}, 10)`)
            .style('display', 'none')

        this.slider.selectAll('image')
            .attr('width', iconsize)
            .attr('height', iconsize)
            .style('cursor', 'pointer')

        this.slider.select("#slider-up")
            .attr('xlink:href', this.UP)
            .attr('transform', `translate(${x}, ${-shift - iconsize / 2})`)
            .on('click', () => {
                
                let index = this.values.indexOf(this.chart.getNodeSelection());
                if (index === 0) return;
                this.setDistortion(this.values[index - 1])
            })

        this.slider.select('#slider-down')
            .attr('xlink:href', this.DOWN)
            .attr('transform', `translate(${x}, ${dimensions.height - dimensions.bottom - dimensions.top - shift - 10})`)
            .on('click', () => {
                let index = this.values.indexOf(this.chart.getNodeSelection());
                if (index === this.values.length - 1) return;
                this.setDistortion(this.values[index + 1])
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

        this.svg.select('#node-count').text(`Nodes: ${this.values.length}`)

        this.slider.style('display', this.focus ? 'block' : 'none')

        let dimensions = this.chart.getDimensions()
        
        let rectwidth = dimensions.left * .7
        let rectheight = 30
        let iconsize = 20

        let getFontSize = (d, l) => { // font size changes according to whether the node is focused on or not
            
            if (!this.focus || (this.focus && this.chart.areItemsVisible(d))) return '1em'
            else if (this.focus && this.focus != d) return '.5em'

            let direction = this.values.indexOf(d) - this.values.indexOf(this.focus)
            let pos = this.scale(d), 
                focusPos = this.scale(this.focus) + Math.sign(direction) * this.getStep(this.focus) ;

            let p = pos > focusPos ? focusPos / pos : pos / focusPos;
            return Math.min( (rectwidth * .8) / l, .8) * p  + "em"
        }

        let iconPath = d => this.chart.app === 'crobora' ? `${this.chart.baseUrl}/muvin/images/${this.chart.app}/${this.data[d].type}-icon.svg` : ''
        let rectFill = d => this.focus === d || this.chart.data.getFocus() === d ? this.color.focus : this.color.normal
        let textColor =  d => this.focus === d || this.chart.data.getFocus() === d ? '#fff' : '#000'

        let group = d3.select(this.chart.shadowRoot.querySelector('#labels-group'))
        group.selectAll('g.artist-label')
            .data(this.values)
            .join(
                enter => enter.append('g')
                    .classed('artist-label', true)
                    .style('cursor', 'pointer')
                    .attr('opacity', 1)

                    .call(g => g.append('rect')
                        .attr('fill', rectFill)
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
                        .text(d => this.data[d].name)
                        .attr('class', 'title')
                        .style('font-weight', 'bold')
                        .style('font-size', function(d) { return getFontSize(d, this.getComputedTextLength())})
                        .style('text-anchor', 'middle')
                        .attr('x', (rectwidth -(rectwidth * .05)) / 2)
                        .attr('y', '1.2em')
                        .attr('fill', textColor)
                        .style('pointer-events', 'none')
                    )

                    .call(g => g.append('svg:image')
                        .attr('xlink:href', d => iconPath(d))
                        .attr('class', 'type-icon')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', 2)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        .style('display', d => this.chart.areItemsVisible(d) && this.chart.app === 'crobora' ? 'block' : 'none')
                        .call(image => image.append('title').text(d => this.data[d].type))
                    )
                        
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', this.SETTINGS)
                        .attr('class', 'circle-plus')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', rectwidth)
                        .attr('y', rectheight / 3 - iconsize / 2)
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNodeMenu(d)))
                        .call(image => image.append('title').text('Click to get more options'))
                    )
                    
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', this.NETWORK)
                        .attr('class', 'circle-network')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', rectwidth)
                        .attr('y', rectheight / 3 + iconsize / 2)
                        .style('display', d => this.chart.areItemsVisible(d) && !this.chart.searchHidden ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNetworkMenu(d)))
                        .call(image => image.append('title').text('Click to get more options'))
                    )
                    ,

                update => update.call(g => g.select('text.title')
                        .text(d => this.data[d].name)
                        .attr('fill', textColor)
                        .style('font-size', function(d) { return getFontSize(d, this.getComputedTextLength())})
                    )
                    .call(g => g.select('.circle-plus')
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNodeMenu(d)))
                    )

                    .call(g => g.select('.circle-network')
                        .style('display', d => this.chart.areItemsVisible(d) && !this.chart.searchHidden ? 'block' : 'none')
                        .on('click', d3.contextMenu(d => this.contextmenu.getNetworkMenu(d)))
                    )
                    
                    .call(g => g.select('rect').transition().duration(500)
                        .attr('fill', rectFill)
                        .style('display', d => this.chart.areItemsVisible(d) ? 'block' : 'none') 
                    )

                    .call(g => g.select('.type-icon').attr('xlink:href', d => iconPath(d))
                        .call(image => image.select('title').text(d => this.data[d].type)) 
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

    setFreeze(d) {
        this.freeze = null
        
        this.setHighlight(d)
        this.freeze = d
    }

    releaseFreeze(){
        this.freeze = null
        this.frozenNodes = null
        this.removeHighlight()
    }

    mouseover(e, d) {
        this.chart.tooltip.setNodeContent(d, this.tooltipId)
        this.chart.tooltip.show(e, this.tooltipId, 400)

        this.setHighlight(d)
    }

    mouseout(){
        this.chart.tooltip.hide(this.tooltipId)
        this.removeHighlight()
    }

    async setHighlight(d) {
        // do nothing when the links of a node are highlighted, or if the node is not on focus, or if the player is active
        if (this.freeze || this.values.length === 1) return;
                
        let group = d3.select(this.chart.shadowRoot.querySelector('#chart-group'))

        group.selectAll('g.link')
            .transition()
            .duration(500)
            .attr('opacity', e => e.source === d || e.target === d ? 1 : 0)

        this.frozenNodes = await this.chart.getConnectedNodes(d)

        group.selectAll('g.artist')
            .transition('focus-artist')
            .duration(500)
            .attr('opacity', e => d === e || this.frozenNodes.fst.includes(e) ? 1 : .1)

        group.selectAll('.artist-label')
            .transition('focus-node')
            .duration(500)
            .attr('opacity', e => d === e || this.frozenNodes.fst.includes(e) ? 1 : .1)

        this.chart.nodes.highlightNodeItems(this.frozenNodes.snd)

        if (this.chart.getTimeSelection())
            group.selectAll('.node-link')
                .transition('focus-links')
                .duration(500)
                .attr('opacity', e => e.source.key === d || e.target.key === d ? 1 : 0)

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

        if (this.chart.getTimeSelection()) this.chart.sndlinks.reverse()

        group.selectAll('.artist-label')
            .transition('unfocus-node')
            .duration(500)
            .attr('opacity', 1)
    }

    getStep(value) {
        return this.tickDistances ? this.tickDistances[this.values.indexOf(value)] : this.scale.step()
    }

    getNextPos(d) {
        if (this.values.length === 1 || this.values.indexOf(d) === this.values.length - 1) return this.max;
        let index = this.values.indexOf(d)
        return this.scale(this.values[index + 1])
    }

    getPrevPos(d) {
        if (this.values.length === 1 || this.values.indexOf(d) === 0) return this.min;
        let index = this.values.indexOf(d)
        return this.scale(this.values[index - 1])
    }
}