import * as d3 from 'd3'
import ContextMenu from '../contextmenu.js'

class NodesGroup {
    constructor(chart) {
        this.chart = chart

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group'))

        this.forceSimulation = d3.forceSimulation()
            .alphaMin(.1)
            .force("x", d3.forceX()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 0.05 : .5)
                .x(d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2))
            
            .force("y", d3.forceY()
                .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 1 : .5)
                .y(d => this.chart.yAxis.scale(d.node.key))) 

            .force("collide", d3.forceCollide().radius(d => d.r).iterations(32)) // Force that avoids circle overlapping
            .tick(10)
                
            .on('end', () => { if (this.chart.getTimeSelection()) this.chart.sndlinks.draw() }) 

        this.mouseoverTimeout;
        this.tooltipId = null;

        this.defaultColor = "#ccc"

        this.circleAttrs = {
            r: d => d.r,
            fill: () => this.defaultColor,
            stroke: '#000',
            opacity: d => this.opacity(d),
            class: 'item-circle',
            //display: d => this.opacity(d) ? 'block' : 'none'
        }

        this.displayCircle = d => this.opacity(d) ? 'block' : 'none'

        this.contextmenu = new ContextMenu(chart)
    }

    set() {}

    async computeRadius() {}

    async appendNodes() { }

    // draw the second level nodes of the network (e.g. documents, songs/albums)
    async draw() {

        this.data = await this.chart.data.getItems();
        
        await this.computeRadius()

        await this.appendNodes()

        this.group.selectAll('.doc')
            .on('click', d => { if (d.link) window.open(d.link) })
            .on('mouseenter', d => { let e = d3.event; this.mouseover(e, d, 'item') })
            .on('mouseleave', () => this.mouseout()) // set a timeout to ensure that mouseout is not triggered while rapidly changing the hover

        this.placeItems()

    }      
    
    placeItems() {
        this.forceSimulation.nodes(this.data)
        this.forceSimulation.force('x').initialize(this.data)
        this.forceSimulation.force('collide').initialize(this.data)
        this.forceSimulation.alpha(1).restart()
    }

    /**
     * Function to compute the opacity of nodes according to a number of aspects that define whether they should be visible or not
     * @param {*} d data record 
     * @returns opacity (0, 1)
     */
     opacity(d) {
        let key = d.node.key

        if (!this.chart.drawItems()) { // by default, items should be hidden
            if (this.chart.isSelected(d.year)) return 1 // exception: the given year is selected
            if (this.chart.getNodeSelection() && this.chart.isSelected(key)) {
                if (this.chart.areItemsVisible(key)) return 1 // exception: the given node is selected and its items are visible
            }
        }

        if (!this.chart.drawItems() && !this.chart.isSelected(d.year)) return 0 // by default, items are hidden and the year is not selected
        if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(key)) return 0 // there is a node selected but the user chose not to display the items of that node, or the item do not belong to the selected node
        if (this.chart.isFreezeActive() && !this.chart.isFrozen(d.id)) return 0.1 

        if (this.chart.areItemsVisible(key)) return 1 // display if the items are visible for the given node
        if (this.chart.getTimeSelection() && this.chart.isSelected(key)) return 1 // display if there is a node selected and the item belong to that node
        if (this.chart.areItemsVisible(key) && this.chart.getTimeSelection() && this.chart.isSelected(d.year)) return 1 // display if items are visible for the given node and there 
        if (!this.chart.getTimeSelection() && this.chart.getNodeSelection() && this.chart.isSelected(key)) return 1

        return 0
    }

    isConnected(e, d) {
        return e.id === d.id && e.year === d.year;
    }

    mouseover(e, d, tooltipId) {

        this.chart.tooltip.setItemContent(d, tooltipId)
        this.chart.tooltip.show(e, tooltipId)
        this.tooltipId = tooltipId;

        
        this.group.selectAll('.item-circle')    
            .attr('stroke-width', e => this.isConnected(e, d) ? 3 : 1)

        this.chart.fstlinks.highlightLabels(d)
        this.chart.sndlinks.highlightLinks(d)

        if (this.chart.isFreezeActive())  return

        let collab = d.contributors ? d.contributors.filter( (e,i) => e.name != d.node.name && this.chart.areItemsVisible(e.name)) : []

        this.group.selectAll('.item-circle')
            .attr('opacity', e => {
                if (!this.chart.isNodeVisible(e.node.key)) return 0
                if (collab.length && e.node.name != d.node.name && !collab.includes(e.node.name)) return 0
                if (this.isConnected(d, e)) return 1 // show selected item
                if (d.parent && e.parent && e.parent.id === d.parent.id) return 1 // show siblings (items from same cluster)
                
                return .2
            })
            .attr('stroke-width', e => this.isConnected(d, e) ? 3 : 1)
       
        this.chart.group.selectAll('.image-border')
            .attr('stroke', e => this.isConnected(d, e) ? '#000' : '#fff')

        this.chart.fstlinks.highlight(d)
        this.chart.profiles.downplay(d.node.key)
    }

    mouseout() {

        
        if (this.chart.getTimeSelection()) this.chart.sndlinks.reverse()

        this.chart.tooltip.hide(this.tooltipId)
        this.tooltipId = null;

        this.reverse()     

        this.chart.fstlinks.hideLabels()

        if (this.chart.isFreezeActive()) return

        this.chart.fstlinks.reverse()
        
        this.chart.profiles.reverseDownplay()

    }

    reverse() {
        this.group.selectAll('.item-circle')
            .attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.id) ? 1 : .1) : this.opacity(d) ) 
            .attr('stroke-width', 1)
            .attr('fill', this.defaultColor)

        this.chart.group.selectAll('.image-border').attr('stroke', '#fff')
    }

    highlightNodeItems(nodes) {
        this.group.selectAll('.item-circle')
            .filter(e => this.chart.areItemsVisible(e.node.key))
            .transition('focus-items')
            .duration(500)
            .attr('opacity', e => nodes.includes(e.id) ? 1 : .1)
            .attr('fill', this.defaultColor)
    }

    highlightItem(name){
        let packGroups = d3.selectAll(this.chart.shadowRoot.querySelectorAll('.item-circle'))
            .filter(d => this.opacity(d) ? true : false)

        let selection = packGroups.filter(d => d.title === name)
       
        if (selection.size()) {
            let data = []
            selection.each(function() {
                let d = d3.select(this).datum()

                data.push({
                    cx: d.x,
                    cy: d.y,
                    r: d.r 
                })
            })   

            d3.select(this.chart.shadowRoot.querySelector('#chart-group'))
                .selectAll('.highlight')
                .data(data)
                .join(
                    enter => enter.append('circle')
                        .attr('fill', 'none')
                        .classed('highlight high-item', true),
                    update => update,
                    exit => exit.remove()
                )
                .attrs(d => d)
        } else {
            d3.selectAll(this.chart.shadowRoot.querySelectorAll('.highlight')).classed('high-item', false)
        }
    }

    clearHighlight() {
        this.highlightItem('')
    }

    setUncertainPattern() {
        const defs = this.group
            .append("defs");

        let pattern = defs.append('pattern')
            .attr('id', 'diagonalStripes')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)')
            .attr('width', 4)
            .attr('height', 4);
        
        pattern
            .append("rect")
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("fill", this.defaultColor)

        pattern
            .append("rect")
            .attr("x", 3)
            .attr("y", 0)
            .attr("height", "100%")
            .attr("width", "10%")
            .attr("fill", "white");
    }

    getPatternUrl() {
        return `url('${window.location.pathname}${window.location.search}#diagonalStripes')`
    }
}

export default NodesGroup