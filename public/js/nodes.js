class NodesGroup {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group'))

        this.forceSimulation = d3.forceSimulation()
            .alphaMin(.1)
            .force("x", d3.forceX()
                .strength(() => this.chart.getTimeSelection() ? .7 : .9)
                .x(d => this.chart.xAxis.scale(d.year)))
            .force("y", d3.forceY()
                .strength(() => this.chart.getTimeSelection() ? .4 : .2)
                .y(d => this.chart.yAxis.scale(d.artist.name ))) 
            .force("collide", d3.forceCollide().radius(d => d.r).iterations(32)) // Force that avoids circle overlapping

        this.mouseoverTimeout;
        this.tooltipId = null;

        this.circleAttrs = {
            r: d => d.r,
            fill: () => this.chart.getColors('item').color,
            stroke: '#000',
            opacity: d => this.opacity(d),
            class: 'item-circle'
        }
    }

    set() {}

    async computeRadius() {}

    async appendNodes() { }

    // draw the second level nodes of the network (e.g. documents, songs/albums)
    async draw() {

        this.data = this.chart.data.items;
        
        await this.computeRadius()

        await this.appendNodes()

        this.group.selectAll('.doc')
            .on('contextmenu', d3.contextMenu(d => this.chart.getContextMenu(d)))
            .on('mouseenter', d => { let e = d3.event; this.mouseover(e, d, 'item') })
            .on('mouseleave', () => this.mouseout()) // set a timeout to ensure that mouseout is not triggered while rapidly changing the hover

        this.placeItems()

    }      
    
    placeItems() {
        this.forceSimulation.nodes(this.data)
        this.forceSimulation.force('x').initialize(this.data)
        this.forceSimulation.force('collide').initialize(this.data)
        this.forceSimulation.alpha(1).restart()
        this.forceSimulation.tick(10)
        this.forceSimulation.on("tick", () => this.group.selectAll('.doc')
                .attr('transform', d => `translate(${d.x}, ${d.y})` ))
                
            // .on('end', () => { if (this.chart.getTimeSelection()) this.chart.sndlinks.draw() })  
    }

    /**
     * Function to compute the opacity of nodes according to a number of aspects that define whether they should be visible or not
     * @param {*} d data record 
     * @returns opacity (0, 1)
     */
     opacity(d) {
        let artist = d.artist.name
        
        
        if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(artist)) return 0

        if (this.chart.areItemsVisible(artist)) return 1
        if (this.chart.getTimeSelection() && this.chart.isSelected(artist)) return 1
        if (this.chart.areItemsVisible(artist) && this.chart.getTimeSelection() && this.chart.isSelected(d.year)) return 1
        if (!this.chart.getTimeSelection() && this.chart.getNodeSelection() && this.chart.isSelected(artist)) return 1

        return 0
    }

    mouseover(e, d, tooltipId) {
        if ((this.chart.getTimeSelection() && !this.chart.isSelected(d.year)) || (d.children && d.name === 'singles')) return

        this.chart.tooltip.setNodeContent(d, tooltipId)
        this.chart.tooltip.show(e, tooltipId)
        this.tooltipId = tooltipId;

        if (this.chart.isFreezeActive()) return

        let collab = d.contnames ? d.contnames.filter( (e,i) => e != d.artist.name && this.chart.areItemsVisible(e)) : []

        this.group.selectAll('.item-circle')
            .transition()
            .duration(100)
            .attr('opacity', e => {
                if (!this.chart.isNodeVisible(e.artist.name)) return 0
                if (collab.length && e.artist.name != d.artist.name && !collab.includes(e.artist.name)) return 0
                if (e.id === d.id) return 1 // show selected item
                if (d.parent && e.parent && e.parent.id === d.parent.id) return 1 // show siblings (items from same cluster)
                
                return .2
            })
            .attr('stroke-width', e => d.id === e.id ? 3 : 1)

        this.chart.group.selectAll('.node-link')
            .attr('opacity', function(e) { return d3.select(this.parentNode).datum().value.id === d.id ? 1 : 0 })     

        this.chart.fstlinks.highlight(d)
        this.chart.profiles.downplay(d)
    }

    mouseout() {

        this.chart.fstlinks.reverse()
        this.chart.sndlinks.reverse()

        this.chart.tooltip.hide(this.tooltipId)
        this.tooltipId = null;
        
        this.chart.profiles.reverseDownplay()

        if (this.chart.isFreezeActive()) return;

        this.reverse()     

    }

    reverse() {
        this.group.selectAll('.item-circle')
            .transition()
            .duration(100)
            .attr('opacity', d => this.opacity(d) )
            .attr('stroke-width', 1)
    }

    highlightItem(name){
        let packGroups = d3.selectAll(this.chart.shadowRoot.querySelectorAll('.item-circle'))
            .filter(d => this.opacity(d) ? true : false)

        let selection = packGroups.filter(d => d.name === name)
       
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
        this.chart.shadowRoot.querySelector('#items-input').value = '';
        this.highlightItem('')
    }
}