import * as d3 from 'd3';
import contextMenu from './d3/d3-context-menu.js';

import fisheye from './d3/fisheye.js'
import ContextMenu from './contextmenu.js'
import { getTicksDistance, truncateText } from './utils.js'


// Images
import plusIcon from '../images/plus.svg'
import upIcon from '../images/up.svg'
import downIcon from '../images/down.svg'


class NodesAxis {
    constructor(chart) {
        this.chart = chart
        this.scale = fisheye.scale(d3.scalePoint) 

        this.tickDistances;
        this.div = d3.select(this.chart.shadowRoot.querySelector('.nodes-panel'))

        this.freeze = false

        this.tooltipId = 'node'

        this.slider = d3.select(this.chart.shadowRoot.querySelector('#y-slider'))

        this.distortion = 4;
        this.shift = 0;

        this.color = {focus: '#2C3E50', normal: '#f5f5f5'}

        this.contextmenu = new ContextMenu(chart)
        
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
            
        this.setSlider()
        
    }

    async setDistortion(d) {
        
        if (this.values.length === 1 || !d) return

        this.chart.sndlinks.hide()

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

        // TODO: The following elements might not be used anymore, verify!
        this.slider.select("#slider-up")
            .attr('xlink:href', `../assets/${upIcon}`)
            .attr('transform', `translate(${x}, ${-shift - iconsize / 2})`)
            .on('click', () => {
                
                let index = this.values.indexOf(this.chart.getNodeSelection());
                if (index === 0) return;
                this.setDistortion(this.values[index - 1])
            })

        this.slider.select('#slider-down')
            .attr('xlink:href', `../assets/${downIcon}`)
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

        this.slider.style('display', this.focus ? 'block' : 'none')

        let dimensions = this.chart.getDimensions()
        
        let rectwidth = dimensions.left * .7
        let rectheight = 30
        let iconsize = 20

        // let getFontSize = (d, l) => { // font size changes according to whether the node is focused on or not
            
        //     if (!this.focus || (this.focus && this.chart.areItemsVisible(d))) return '1em'
        //     else if (this.focus && this.focus != d) return '.5em'

        //     let direction = this.values.indexOf(d) - this.values.indexOf(this.focus)
        //     let pos = this.scale(d), 
        //         focusPos = this.scale(this.focus) + Math.sign(direction) * this.getStep(this.focus) ;

        //     let p = pos > focusPos ? focusPos / pos : pos / focusPos;
        //     return Math.min( (rectwidth * .8) / l, .8) * p  + "em"
        // }

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

                    // Draw a rectangle that contains the node
                    .call(g => g.append('rect')
                        .attr('fill', rectFill)
                        .attr('width', rectwidth + 25)
                        .attr('height', rectheight)
                        .attr('x', rectwidth * -.05)
                        .on('click', d => this.setDistortion(d))
                        .on('mouseover', d => { let e = d3.event; this.mouseover(e, d) })
                        .on('mouseout', () => this.mouseout())
                    )

                    // Draw a + sign next to the node to open the associated menu
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', `../assets/${plusIcon}`)
                        .attr('class', 'circle-plus')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', rectwidth)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        .on('click', function(d, i) {
                            // Create and call the context menu handler with the correct context
                            const menuHandler = contextMenu({ 
                                shadowRoot: _this.chart.shadowRoot, 
                                menuItems : _this.contextmenu.getNodeMenu(d)
                            })  // Get the function
                            menuHandler.call(this, d, i);  // Call the function within the context of the clicked element
                        })
                        .call(image => image.append('title').text('Click to get more options'))
                    )
   
                    // Draw the name of the node
                    .call(g => g.append('text')
                        .text(d => this.data[d].name)
                        .attr('class', 'title')
                        .style('font-size', '11px')
                        .attr('y', rectheight / 2 + 4)
                        .attr('fill', textColor)
                        .style('pointer-events', 'none')
                    )

                    // Draw the icon for the crobora application, each category has an associated icon
                    .call(g => g.append('svg:image')
                        .attr('xlink:href', d => iconPath(d))
                        .attr('class', 'type-icon')
                        .attr('width', iconsize)
                        .attr('height', iconsize)
                        .attr('x', 2)
                        .attr('y', rectheight / 2 - iconsize / 2)
                        // .style('display', d => this.chart.areItemsVisible(d) && this.chart.app === 'crobora' ? 'block' : 'none')
                        .call(image => image.append('title').text(d => this.data[d].type))
                    )
                    
                    
                    ,

                update => update.call(g => g.select('text.title')
                        .text(d => this.data[d].name)
                        .attr('fill', textColor)
                    )
                    .call(g => g.select('.circle-plus')
                        .on('click', function(d, i) {
                            // Create and call the context menu handler with the correct context
                            const menuHandler = contextMenu({ 
                                shadowRoot: _this.chart.shadowRoot, 
                                menuItems : _this.contextmenu.getNodeMenu(d)
                            })  // Get the function
                            menuHandler.call(this, d, i);  // Call the function within the context of the clicked element
                        })
                    )

                    .call(g => g.select('rect').transition().duration(500)
                        .attr('fill', rectFill)
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

            group.selectAll('text').each(function() { d3.select(this).call(truncateText, rectwidth) })
                
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
            this.chart.sndlinks.highlightLinks(d)

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

export default NodesAxis