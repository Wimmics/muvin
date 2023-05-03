class NodesGroup {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group'))

        // this.forceSimulation = d3.forceSimulation()
        //     .alphaMin(.1)
        //     .force("x", d3.forceX()
        //         .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .4 : .7)
        //         .x(d => this.chart.xAxis.scale(d.year)))
            
        //     .force("y", d3.forceY()
        //         .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .8 : .2)
        //         .y(d => this.chart.yAxis.scale(d.artist.key))) 

        //     .force("collide", d3.forceCollide().radius(d => d.r).iterations(32)) // Force that avoids circle overlapping
        //     .tick(10)
                
        //     .on('end', () => { if (this.chart.getTimeSelection()) this.chart.sndlinks.draw() }) 

        this.mouseoverTimeout;
        this.tooltipId = null;

        this.circleAttrs = {
            r: d => d.r,
            fill: () => this.chart.getItemColor(),
            stroke: '#000',
            opacity: d => this.opacity(d),
            class: 'doc item-circle',
            cx: (d,i) => {
                let initialPos = (this.chart.xAxis.scale(d.year) - this.chart.xAxis.getStep(d.year) * .4) + d.r
                let remainder = (d.index % this.grid[d.artist.key][d.year].numCols) 
                let size = (d.r * 2 + this.grid[d.artist.key][d.year].spacing)
                return initialPos + remainder * size
            },
            cy: (d,i) => {
                let initialPos = this.chart.yAxis.scale(d.artist.key) - d.r
                let remainder = Math.floor( d.index / this.grid[d.artist.key][d.year].numCols) 
                let size = (d.r * 2 + this.grid[d.artist.key][d.year].spacing)
                return initialPos - remainder * size
            }
        }

        this.rectAttrs = {
            width: d => d.r * 2,
            height: d => d.r * 2,
            fill: () => this.chart.getItemColor(),
            stroke: '#000',
            opacity: d => this.opacity(d),
            class: 'doc item-circle',
            x: (d,i) => {
                let initialPos = (this.chart.xAxis.scale(d.year) - this.chart.xAxis.getStep(d.year) * .4)
                let remainder = (i % this.grid[d.artist.key][d.year].numCols) 
                let size = (d.r * 2 + this.grid[d.artist.key][d.year].spacing)
                return initialPos + remainder * size
            },
            y: (d,i) => {
                let initialPos = this.chart.yAxis.scale(d.artist.key) - (d.r * 2)
                let remainder = Math.floor(i / this.grid[d.artist.key][d.year].numCols) 
                let size = (d.r * 2 + this.grid[d.artist.key][d.year].spacing)
                return initialPos - remainder * size
            }
        }

        this.contextmenu = new ContextMenu()

        this.setUncertainPattern()

    }

    set() {}

    computeRadius() {}

    async appendNodes() { }

    async prepareData() {
        let data = this.chart.data.getItems();

        this.data = d3.nest()
            .key(e => e.artist.name + '-' + e.artist.type)
            .key(e => e.year)
            .entries(data)
        
        console.log('nested = ', this.data)

        this.grid = {}
        let spacing = 2;

        let size = (this.radius.normal * 2) + spacing
        let chunkSize = 20
        this.data.forEach(d => {

            let height = this.chart.yAxis.getStep(d.key)
            console.log("height =", height)
            this.grid[d.key] = {}

            let numRows = Math.floor(height / size) 

            d.values.forEach(e => {
                let index = 0
                e.clusters = []
                e.singles = []

                let width = this.chart.xAxis.getStep(e.key)
                let numCols = Math.floor(width / size)

                this.grid[d.key][e.key] = {
                    numCols: numCols,
                    numRows: numRows,
                    height: height,
                    width: width,
                    spacing: spacing
                }
                
                let maxItems = numCols * numRows
                if (e.values.length > maxItems) {
                    
                    for (let i = 0; i < e.values.length; i += chunkSize) {
                        const chunk = e.values.slice(i, i + chunkSize);
                        if (chunk.length === chunkSize)
                            e.clusters.push({
                                artist: e.values[0].artist,
                                year: e.key,
                                cluster: true,
                                values: chunk,
                                r: this.computeRadius(e.key),
                                index: index++
                            })
                        else chunk.forEach(value => {
                            value.r = this.computeRadius(e.key)
                            value.index = index++
                            e.singles.push(value)
                        })
                    }
                } else {
                    for (let value of e.values) {
                        value.r = this.computeRadius(e.key)
                        value.index = index++
                        e.singles.push(value)
                    }
                }
                
            })
        })

        console.log(this.data)
        console.log(this.grid)
    }

    // draw the second level nodes of the network (e.g. documents, songs/albums)
    async draw() {

        await this.prepareData();
        
        // await this.computeRadius()

        // a group per item (e.g. an item == an image)
        this.group.selectAll('g.artist')
            .selectAll('.year')
            .data(d => this.data.find(e => e.key === d).values )
            .join(
                enter => enter.append('g')
                    .classed('year', true)
                    .attr('id', d => `${d.values[0].artist.key}-${d.key}`),
                update => update,
                exit => exit.remove()
            )

        await this.appendNodes()

        this.group.selectAll('.doc')
            .on('contextmenu', d3.contextMenu(d => this.contextmenu.getItemMenu()))
            .on('mouseenter', d => { let e = d3.event; this.mouseover(e, d, 'item') })
            .on('mouseleave', () => this.mouseout()) // set a timeout to ensure that mouseout is not triggered while rapidly changing the hover

        // this.placeItems()

    }      

    async appendSingles(){
        this.group.selectAll('g.year')
            .selectAll('circle.doc')            
            .data(d => d.singles )
            .join(
                enter => enter.append('circle')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .attrs(this.circleAttrs),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(circle => circle.attrs(this.circleAttrs)),
                exit => exit.remove()        
            )
    } 

    async appendClusters(){
        this.group.selectAll('g.year')
            .selectAll('rect.doc')            
            .data(d => d.clusters )
            .join(
                enter => enter.append('rect')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .attrs(this.rectAttrs),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(rect => rect.attrs(this.rectAttrs)),
                exit => exit.remove()        
            )
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
        let key = d.artist.key
        
        
        if (this.chart.getNodeSelection() && !this.chart.isNodeVisible(key)) return 0

        if (this.chart.areItemsVisible(key)) return 1
        if (this.chart.getTimeSelection() && this.chart.isSelected(key)) return 1
        if (this.chart.areItemsVisible(key) && this.chart.getTimeSelection() && this.chart.isSelected(d.year)) return 1
        if (!this.chart.getTimeSelection() && this.chart.getNodeSelection() && this.chart.isSelected(key)) return 1

        return 0
    }

    mouseover(e, d, tooltipId) {
        if ((this.chart.getTimeSelection() && !this.chart.isSelected(d.year)) || (d.children && d.name === 'singles')) return

        this.chart.tooltip.setItemContent(d, tooltipId)
        this.chart.tooltip.show(e, tooltipId)
        this.tooltipId = tooltipId;

        if (this.chart.isFreezeActive()) return

        // TODO: use contributors instead of contnames
        let collab = d.contnames ? d.contnames.filter( (e,i) => e != d.artist.name && this.chart.areItemsVisible(e)) : []

        this.group.selectAll('.item-circle')
            .transition()
            .duration(100)
            .attr('opacity', e => {
                if (!this.chart.isNodeVisible(e.artist.key)) return 0
                if (collab.length && e.artist.name != d.artist.name && !collab.includes(e.artist.name)) return 0
                if (e.id === d.id) return 1 // show selected item
                if (d.parent && e.parent && e.parent.id === d.parent.id) return 1 // show siblings (items from same cluster)
                
                return .2
            })
            .attr('stroke-width', e => d.id === e.id ? 3 : 1)

        if (this.chart.getTimeSelection() && this.chart.isSelected(d.year)) {
            this.chart.group.selectAll('.node-link')
                .attr('opacity', function(e) { return d3.select(this).datum().value.id === d.id ? 1 : 0 })    
            
            this.chart.group.selectAll('.image-border')
                .attr('stroke', e => e.id === d.id ? '#000' : '#fff')
        }

        this.chart.fstlinks.highlight(d)
        this.chart.profiles.downplay(d.artist.key)
    }

    mouseout() {

        this.chart.fstlinks.reverse()
        if (this.chart.getTimeSelection()) this.chart.sndlinks.reverse()

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
            .attr('fill', this.chart.getItemColor())

        this.chart.group.selectAll('.image-border').attr('stroke', '#fff')
    }

    highlightNodeItems(nodes) {
        this.group.selectAll('.item-circle')
            .filter(e => this.chart.areItemsVisible(e.artist.key))
            .transition('focus-items')
            .duration(500)
            .attr('opacity', e => nodes.includes(e.id) ? 1 : .1)
            .attr('fill', e => nodes.includes(e.id) && this.chart.isUncertain(e) ? this.getPatternUrl() : this.chart.getItemColor())
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
            .attr("fill", this.chart.getItemColor())

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