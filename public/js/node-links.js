// group that holds the second-level links (i.e. links between specific items)

class NodeLinksGroup{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodeLinks-group')) 
    }

    set() {
        
        // this.setGradientPattern()
        // this.setArrowhead()
    }

    // draw the second level links (e.g. links between second level nodes -- songs/documents)
    draw() {
        const _this = this;

        const linkInfo = d => `${d.sourceArtist} → ${d.targetArtist}\nItem: ${d.value.name}\nContribution: ${d.types.map(e => capitalizeFirstLetter(e)).join(', ')}`

        let data = this.getData()
        
        let linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)

        let pathAttrs = {
            "stroke": '#000',
            'stroke-width': 4,
            'fill': 'none',
            'd': d => linkGenerator(d)
        }

        let link = this.group.selectAll('.node-link')
            .data(data)
            .join(
                enter => enter.append('g')
                    .classed('node-link', true)
                    .on('mouseenter', function(d) { _this.mouseover(d, this) })
                    .on('mouseleave', () => this.mouseout())                    
                    .call(g => g.append('title').text(linkInfo)),
                update => update.call(g => g.select('title').text(linkInfo)),
                exit => exit.remove()
            )
            .call(g => g.transition()
                .duration(500)
                .attr('opacity', 1))

        link.selectAll('path')
            .data(d => d.values)
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-link')
                    .attrs(pathAttrs),
                update => update.call(path => path.attrs(pathAttrs)),
                exit => exit.remove()
            )
                    
    }
    
    hide() {
        this.group.selectAll('.node-link').attr('opacity', 0)
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.node-link')
            .attr('opacity', function() { return this === elem ? 1 : 0 } )

        let selected = e => e.id === d.value.id && e.year === d.value.year && (e.artist.name === d.sourceArtist || e.artist.name === d.targetArtist)
        this.chart.group.selectAll('.item-circle')
            .attr('opacity', e => selected(e) ? 1 : .2 )
            .attr('stroke-width', e => selected(e) ? 2 : 1 )

        this.chart.profiles.downplay()
        this.chart.fstlinks.downplay()

    }

    mouseout() {
        if (!this.chart.getTimeSelection()) return
        
        this.group.selectAll('.node-link')
            .attr('opacity', 1)
        
        this.chart.group.selectAll('.item-circle')
            .attr('opacity', 1)
            .attr('stroke-width', 1)

        this.chart.profiles.reverseDownplay()
        this.chart.fstlinks.reverse()
    }

    /**
     * Function to compute the second level links of the network based on the nodes in focus
     * @returns an array containing the links
     */
    getData() {
        // keep one link per node
        let links = this.chart.data.links.filter(d => this.chart.areItemsVisible(d.source) && this.chart.areItemsVisible(d.target) && this.chart.isSelected(d.year))

        links = links.filter( (d,i) => links.findIndex(e => ((e.source === d.source && e.target === d.target) || (e.source === d.target && e.target === d.source)) && e.item.id === d.item.id) === i)
        
        let linkedItems = links.map(d => d.item.id)
        let selection = this.chart.group.selectAll('.doc').filter(e => linkedItems.includes(e.id) && this.chart.isSelected(e.year))
        let data = []

        let dim = this.chart.getDimensions()

        links.forEach(d => {
            let nodes = selection.filter(e =>  [d.source, d.target].includes(e.artist.name) && e.id === d.item.id ).nodes()
            let nodesData = nodes.map(e => d3.select(e).datum()) // recover the associated data for each element
            for (let j = 0; j < nodes.length - 1; j++) {

                let sourceIndex = nodesData.findIndex(e => e.artist.name === d.source)
                let sData = nodesData[sourceIndex]
                let source = {x: sData.x, y: sData.y}
                let sourceRadius = sData.r

                let targetIndex = nodesData.findIndex(e => e.artist.name === d.target)
                let tData = nodesData[targetIndex]
                let target = {x: tData.x, y: tData.y}
                let targetRadius = tData.r
                
                if (source.y > target.y) {
                    source.y -= sourceRadius
                    target.y += targetRadius
                } else {
                    source.y += sourceRadius
                    target.y -= targetRadius
                }


                let types = d.type.filter( (e,i) => d.type.indexOf(e) === i)
                types.sort( (a,b) => a.localeCompare(b))

                let values = []
                types.forEach( (t,i) => {
                    source.x += 5 * i
                    target.x += 5 * i
                    let link = {source: {...source}, target: {...target}}

                    values.push({...link, type: t, stroke: '.stroke'})
                    values.push({...link, type: t, stroke: ''})
                })

                data.push({value: d.item,
                    sourceArtist: d.source, 
                    targetArtist: d.target, 
                    // sourceNode: nodes[sourceIndex],
                    // targetNode: nodes[targetIndex],
                    types: types,
                    values: values
                })
                
                
            }
        })

        return data
    }
}