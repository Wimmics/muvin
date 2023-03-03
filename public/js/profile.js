class ProfilesGroup {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodes-group'))

        this.tooltipId = 'profile';

        this.selected = []
    }

    async set() {
    
        let chartdata = this.chart.getData()
        let types = chartdata.linkTypes

        let nodes = chartdata.getNodes()
        let dates = chartdata.getDates()
        this.itemsByYear = []
        nodes.forEach(artist => {
            dates.forEach(year => {       
                
                let res = chartdata.clusters.filter(d => d.artist.name === artist && d.year === year)
                if (!this.chart.displayBestOfs())
                    res = res.filter(d => d.audio)

                let item = {
                    year: year,
                    artist: artist,
                    values: [...res]
                }

                types.forEach(type => {
                    let resType = chartdata.items.filter(d => d.artist.name === artist && d.year === year && d.artist.contribution.includes(type))
                    if ( !this.chart.displayBestOfs())
                        resType = resType.filter(d => d.audio)
                    item[type] = resType.length
                })

                this.itemsByYear.push(item)
            })
        })

        this.setData()

    }

    setData() {
        let types = this.chart.data.linkTypes;
        let stack = d3.stack()
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderInsideOut)
            .keys(types)

        let dates = this.chart.data.dates;
        let nodes = this.chart.data.getNodes()
    
        this.data = nodes.map(artist => {
            const artistData = this.itemsByYear.filter(e => e.artist === artist && dates.includes(e.year))
            
            return {
                'artist': artist,
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

    downplay(d) {
        this.group.selectAll('.profile')
            .transition()
            .duration(500)
            .attr('opacity', e => {
                if (!d) return .1
                if (d && this.chart.data.artists[d]) 
                    return this.chart.data.artists[d].collaborators.some(x => x.name === e.artist) || e.artist === d ? .3 : 0
                if (d.contnames.some(x => this.chart.isNodeValid(x) && x !== d.artist.name))
                    return d.contnames.includes(e.artist) || d.artist.name === e.artist ? .1 : 0
                return .1
            })
    }

    reverseDownplay() {
        this.group.selectAll('.profile')
            .transition()
            .duration(500)
            .attr('opacity', 1)
    }

    getHeight(d) {
        let height = this.chart.yAxis.getStep(d) // reference height for the wave
        if (!this.chart.getNodeSelection()) 
            return height * .6

        if (this.chart.isSelected(d) && this.chart.data.nodes.indexOf(d) === 0) 
            return height * .5

        if (this.chart.data.nodes.indexOf(d) === 0) 
            return height * .8
        
        return height
    }

    draw() {
        const _this = this;

        let scale = d3.scaleLinear()
            .domain(this.getExtent())

        let area = d3.area()
            .x(d => this.chart.xAxis.scale(d.data.year))
            .y0(d => this.chart.yAxis.scale(d.data.artist) + (this.chart.isProfileActive(d) ? scale(d[1]) : 0))
            .y1(d => this.chart.yAxis.scale(d.data.artist) + (this.chart.isProfileActive(d) ? scale(d[0]) : 0))
            .curve(d3.curveBasis) 

        this.group.selectAll('g.profile')
            .selectAll('path')
            .data(d => this.chart.isProfileVisible(d.artist) ? d.data : [])
            .join(
                enter => enter.append('path'),
                update => update,
                exit => exit.remove() 
            )
            .attr('d', function(d) {
                let height = _this.getHeight(d3.select(this.parentNode).datum().artist)
                scale.range([-height, height]) // changes for each node
                return area(d)
            })
            .attr('fill', d => this.chart.displayProfileColors() ? this.chart.getTypeColor(d.key) : "#f5f5f5")
            .attr('stroke', d => this.chart.displayProfileColors() ? d3.rgb(this.chart.getTypeColor(d.key)).darker() : '#ccc')
            .attr('opacity', '1')
            .on('mouseenter', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mousemove', d => {let e = d3.event; this.mouseover(e, d); })
            .on('mouseout', () => this.mouseout())
            .on('click', d => {let e = d3.event; this.select(e, d); })

        let dimensions = this.chart.getDimensions()
        this.group.selectAll('g.profile')
            .selectAll('line')
            .data(d => !this.chart.isProfileVisible(d.artist) ? [d.artist] : [])
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
        let index = this.selected.findIndex(s => s.node === d[0].data.artist && s.key === d.key)

        if (index >= 0) this.selected.splice(index, 1) // if path is already selected, remove it from the list
        else this.selected.push({ node: d[0].data.artist, key: d.key }) // otherwise, include it in the list of selected paths

        this.mouseout()
        
    }

    mouseover(e, d) {

        this.chart.tooltip.setContent(this.getTooltipContent(e, d), this.tooltipId)
        this.chart.tooltip.show(e, this.tooltipId)
       
        let node = d[0].data.artist
        this.group.selectAll('g.profile').selectAll('path')
            .attr('opacity', x => node != x[0].data.artist ? 1 : (d.key === x.key ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => x.artist.name != node ? 1 : (x.artist.name === node && x.artist.contribution.includes(d.key) ? 1 : .1))

        this.chart.fstlinks.reverse()
    }

    mouseout() {
        this.chart.tooltip.hide(this.tooltipId)

        this.group.selectAll('g.profile').selectAll('path') // update opacity of paths
            .attr('opacity', x => !this.selected.some(s => s.node === x[0].data.artist) ? 1 : (this.selected.some(s => s.node === x[0].data.artist && s.key === x.key) ? 1 : .1))

        this.chart.group.selectAll('.doc')
            .attr('opacity', x => !this.selected.some(s => s.node === x.artist.name) ? 1 : (this.selected.some(s => s.node === x.artist.name && x.artist.contribution.includes(s.key)) ? 1 : .1))

        this.chart.fstlinks.reverse()
    }  

    getTooltipContent(e, d) {
        let artist = d[0].data.artist || d[0].data.artist.name
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = this.chart.getData()
        let values = data.items.filter(e => e.artist.name === artist && e.year === year && e.artist.contribution.includes(d.key))
        if (!this.chart.displayBestOfs())
            values = values.filter(e => e.audio)
        

        return `<b> ${artist}</b><br><br>
        <b>Contribution Type:</b> ${capitalizeFirstLetter(d.key)}<br><br>
        <b>${values.length}</b> items in <b>${year}</b>`

    }
}