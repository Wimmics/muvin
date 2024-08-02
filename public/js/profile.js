class Profile {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.tooltipId = 'profile';

        this.selected = []
    }

    async set() {
    
        let types = this.chart.data.getLinkTypes()
        let nodes = await this.chart.data.getNodesList()
        let dates = this.chart.data.getDates()
        let items = this.chart.data.getItems()
       
        let itemsByYear = []
        nodes.forEach(node => { // each node is an object containing name, type and a contributions array
            dates.forEach(year => {       
                
                let res = items.filter(d => d.node.key === node.key && d.year === year)

                let item = {
                    year: year,
                    node: node,
                    values: [...res]
                }

                types.forEach(type => {
                    let resType = items.filter(d => d.node.key === node.key && d.year === year && d.node.contribution.includes(type))
                
                    item[type] = resType.length
                })

                itemsByYear.push(item)
            })
        })

        this.stack = d3.stack()
            .keys(types)

        await this.setStack()
        
        this.data = nodes.map(node => {
            const nodeData = itemsByYear.filter(e => e.node.key === node.key && dates.includes(e.year))
            
            return {
                'node': node,
                'data' : this.stack(nodeData)
            }
        })

        /// one group per artist ; it will hold the profile wave ////////
        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group')).selectAll('g.artist')
            .selectAll('g.profile')
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('profile', true),
                update => update,
                exit => exit.remove()
            )


        this.heightScale = d3.scaleLinear()
            .domain(this.getExtent())

        this.area = d3.area()
            .x(d => this.chart.xAxis.scale(d.data.year) + this.chart.xAxis.step(d.data.year) / 2)
            .y0(d => this.chart.yAxis.scale(d.data.node.key) + (this.chart.isProfileActive(d) ? this.heightScale(d[1]) : 0))
            .y1(d => this.chart.yAxis.scale(d.data.node.key) + (this.chart.isProfileActive(d) ? this.heightScale(d[0]) : 0))
            .curve(d3.curveBasis) 

    }

    async setStack() {}

    getHeight() {}

    getExtent() {}

    setArea() {}

    draw() {
        const _this = this;

        this.group.selectAll('path')
            .data(d => this.chart.isProfileVisible(d.node.key) ? d.data : [])
            .join(
                enter => enter.append('path'),
                update => update,
                exit => exit.remove() 
            )
            .attr('d', function(d) { return _this.setArea(d, d3.select(this.parentNode).datum().node.key) })
            .attr('fill', d => this.chart.getTypeColor(d.key))
            .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d.key)).darker())
            .attr('opacity', '1')
            .on('mouseenter', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mousemove', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mouseleave', () => this.mouseout())
            .on('click', d => {let e = d3.event; this.select(e, d); })

        let dimensions = this.chart.getDimensions()
        this.group.selectAll('line')
            .data(d => !this.chart.isProfileVisible(d.node.key) ? [d.node.key] : [])
            .join(
                enter => enter.append('line'),
                update => update,
                exit => exit.remove()
            )
            .attr('x1', dimensions.left)
            .attr('x2', dimensions.width - dimensions.right)
            .attr('y1', d => this.chart.yAxis.scale(d))
            .attr('y2', d => this.chart.yAxis.scale(d))
            .attr('stroke', '#000')
            
    }

    /**
     * 
     * @param {*} d A key identifying a node (i.e. 'name-type')
     */
    downplay(d) {
        this.group
            .transition()
            .duration(500)
            .attr('opacity', e => {
                if (!d) return .1

                if (this.chart.data.getNodeById(d)) 
                    return this.chart.data.getNodeById(d).collaborators.some(x => x.key === e.node.key) || e.node.key === d ? .3 : 0
                
                if (d.contributors.some(x => this.chart.isNodeValid(x) && x.key !== d))
                    return d.contributors.some(x => x.key === e.node.key) || d === e.node.key ? .1 : 0
                
                return .1
            })
    }

    reverseDownplay() {
        this.group
            .transition()
            .duration(500)
            .attr('opacity', 1)
    }

    select(e, d) {
        let index = this.selected.findIndex(s => s.node.key === d[0].data.node.key && s.key === d.key)

        if (index >= 0) this.selected.splice(index, 1) // if path is already selected, remove it from the list
        else this.selected.push({ node: d[0].data.node, key: d.key }) // otherwise, include it in the list of selected paths

        this.mouseout()
        
    }

    mouseover(e, d) {

        // this.chart.tooltip.setContent(this.getTooltipContent(e, d), this.tooltipId)
        this.chart.tooltip.setProfileContent(e, d, this.tooltipId)
        this.chart.tooltip.show(e, this.tooltipId)
       
        let node = d[0].data.node
        this.group.selectAll('path')
            .attr('opacity', x => node.key != x[0].data.node.key ? 1 : (d.key === x.key ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => x.node.key != node.key ? 1 : ( x.node.key === node.key && x.node.contribution.includes(d.key) ? 1 : .1))

        //if (!this.chart.isFreezeActive()) this.chart.fstlinks.reverse()
    }

    mouseout() {
        this.chart.tooltip.hide(this.tooltipId)

        this.group.selectAll('path') // update opacity of paths
            .attr('opacity', x => !this.selected.some(s => s.node.key === x[0].data.node.key) ? 1 : (this.selected.some(s => s.node.key === x[0].data.node.key && s.key === x.key) ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => !this.selected.some(s => s.node.key === x.node.key) ? 1 : (this.selected.some(s => s.node.key === x.node.key && x.node.contribution.includes(s.key)) ? 1 : .1))

        //if (!this.chart.isFreezeActive()) this.chart.fstlinks.reverse()
    }  
}