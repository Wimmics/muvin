class ProfilesGroup {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.tooltipId = 'profile';

        this.selected = []
    }

    async set() {
    
        let types = this.chart.data.getLinkTypes()
        let nodes = this.chart.data.getNodesList()
        let dates = this.chart.data.getDates()
        let items = this.chart.data.getItems()

        this.itemsByYear = []
        nodes.forEach(node => { // each node is an object containing name, type and a contributions array
            dates.forEach(year => {       
                
                let res = items.filter(d => d.artist.key === node.key && d.year === year)

                let item = {
                    year: year,
                    artist: node,
                    values: [...res]
                }

                types.forEach(type => {
                    let resType = items.filter(d => d.artist.key === node.key && d.year === year && d.artist.contribution.includes(type))
                
                    item[type] = resType.length
                })

                this.itemsByYear.push(item)
            })
        })

        await this.setData()

        /// one group per artist ; it will hold the profile wave ////////
        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group')).selectAll('g.artist')
            .selectAll('g.profile')
            .data(d => this.data.filter(e => e.artist.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('profile', true),
                update => update,
                exit => exit.remove()
            )

    }

    async setData() {
        let types = this.chart.data.getLinkTypes()

        let stack = d3.stack()
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderInsideOut)
            .keys(types)

        let dates = this.chart.data.getDates()
        let nodes = this.chart.data.getNodesList()
    
        this.data = nodes.map(node => {
            const artistData = this.itemsByYear.filter(e => e.artist.key === node.key && dates.includes(e.year))
            
            return {
                'artist': node,
                'data' : stack(artistData)
            }
        })

    }

    getExtent(){
        // compute min and max height of waves
        let min = 1000, max = -1000;
        this.data.forEach(d => {
            d.data.forEach(item => {
                item.forEach(e => {
                    let min_e = d3.min(e),
                        max_e = d3.max(e);
                    if (min > min_e) min = min_e;
                    if (max < max_e) max = max_e;
                })
            })
        })

        return [min, max]
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

                if (this.chart.data.artists[d]) 
                    return this.chart.data.artists[d].collaborators.some(x => x.key === e.artist.key) || e.artist.key === d ? .3 : 0
                
                if (d.contributors.some(x => this.chart.isNodeValid(x) && x.key !== d))
                    return d.contributors.some(x => x.key === e.artist.key) || d === e.artist.key ? .1 : 0
                
                return .1
            })
    }

    reverseDownplay() {
        this.group
            .transition()
            .duration(500)
            .attr('opacity', 1)
    }

    getHeight(d) {
        let height = this.chart.yAxis.getStep(d) // reference height for the wave
        if (!this.chart.getNodeSelection()) 
            return height * .6

        if (this.chart.isSelected(d) && this.chart.data.getNodesKeys().indexOf(d) === 0) 
            return height * .5

        if (this.chart.data.getNodesKeys().indexOf(d) === 0) 
            return height * .8
        
        return height
    }

    draw() {
        const _this = this;

        let scale = d3.scaleLinear()
            .domain(this.getExtent())

        let area = d3.area()
            .x(d => this.chart.xAxis.scale(d.data.year))
            .y0(d => this.chart.yAxis.scale(d.data.artist.key) + (this.chart.isProfileActive(d) ? scale(d[1]) : 0))
            .y1(d => this.chart.yAxis.scale(d.data.artist.key) + (this.chart.isProfileActive(d) ? scale(d[0]) : 0))
            .curve(d3.curveBasis) 

        this.group.selectAll('path')
            .data(d => this.chart.isProfileVisible(d.artist.key) ? d.data : [])
            .join(
                enter => enter.append('path'),
                update => update,
                exit => exit.remove() 
            )
            .attr('d', function(d) {
                let height = _this.getHeight(d3.select(this.parentNode).datum().artist.key)
                scale.range([-height, height]) // changes for each node
                return area(d)
            })
            .attr('fill', d => this.chart.getTypeColor(d.key))
            .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d.key)).darker())
            .attr('opacity', '1')
            .on('mouseenter', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mousemove', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mouseleave', () => this.mouseout())
            .on('click', d => {let e = d3.event; this.select(e, d); })

        let dimensions = this.chart.getDimensions()
        this.group.selectAll('line')
            .data(d => !this.chart.isProfileVisible(d.artist.key) ? [d.artist.key] : [])
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

    select(e, d) {
        let index = this.selected.findIndex(s => s.node.key === d[0].data.artist.key && s.key === d.key)

        if (index >= 0) this.selected.splice(index, 1) // if path is already selected, remove it from the list
        else this.selected.push({ node: d[0].data.artist, key: d.key }) // otherwise, include it in the list of selected paths

        this.mouseout()
        
    }

    mouseover(e, d) {

        // this.chart.tooltip.setContent(this.getTooltipContent(e, d), this.tooltipId)
        this.chart.tooltip.setProfileContent(e, d, this.tooltipId)
        this.chart.tooltip.show(e, this.tooltipId)
       
        let node = d[0].data.artist
        this.group.selectAll('path')
            .attr('opacity', x => node.key != x[0].data.artist.key ? 1 : (d.key === x.key ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => x.artist.key != node.key ? 1 : ( x.artist.key === node.key && x.artist.contribution.includes(d.key) ? 1 : .1))

        this.chart.fstlinks.reverse()
    }

    mouseout() {
        this.chart.tooltip.hide(this.tooltipId)

        this.group.selectAll('path') // update opacity of paths
            .attr('opacity', x => !this.selected.some(s => s.node.key === x[0].data.artist.key) ? 1 : (this.selected.some(s => s.node.key === x[0].data.artist.key && s.key === x.key) ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => !this.selected.some(s => s.node.key === x.artist.key) ? 1 : (this.selected.some(s => s.node.key === x.artist.key && x.artist.contribution.includes(s.key)) ? 1 : .1))

        this.chart.fstlinks.reverse()
    }  
}