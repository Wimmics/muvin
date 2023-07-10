// group that holds the second-level links (i.e. links between specific items)

class NodeLinksGroup{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodeLinks-group')) 
    }

    set() {

        this.linkInfo = d => `${d.source.name} → ${d.target.name}\nItem: ${d.value.title}\nContribution: ${d.types.map(e => capitalizeFirstLetter(e)).join(', ')}`
        
        this.linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)

        this.pathAttrs = {
            "stroke": d => this.chart.getTypeColor(d.type),
            'stroke-width': 5,
            'fill': 'none',
            'd': d => this.linkGenerator(d)
        }

        this.strokeAttrs = {
            "stroke": d => d3.rgb(this.chart.getTypeColor(d.type)).darker(),
            'stroke-width': 7,
            'fill': 'none',
            'd': d => this.linkGenerator(d)
        }
    }

    // draw the second level links (e.g. links between second level nodes -- songs/documents)
    async draw() {
        const _this = this;

        let data = await this.getData()

        let link = this.group.selectAll('.node-link')
            .data(data)
            .join(
                enter => enter.append('g')
                    .classed('node-link', true)
                    .on('mouseenter', function(d) { _this.mouseover(d, this) })
                    .on('mouseleave', () => this.mouseout())                    
                    .call(g => g.append('title').text(this.linkInfo)),
                update => update.call(g => g.select('title').text(this.linkInfo)),
                exit => exit.remove()
            )
            .call(g => g.attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1  ))

        link.selectAll('path.path-stroke')
            .data(d => d.values)
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-stroke')
                    .attrs(this.strokeAttrs),
                update => update.call(path => path.attrs(this.strokeAttrs)),
                exit => exit.remove()
            )

        link.selectAll('path.path-link')
            .data(d => d.values)
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-link')
                    .attrs(this.pathAttrs),
                update => update.call(path => path.attrs(this.pathAttrs)),
                exit => exit.remove()
            )
                    
    }
    
    hide() {
        this.group.selectAll('.node-link').attr('opacity', 0)
    }

    reverse() {
        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1 )
    }

    highlightLinks(d) {
        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', function(e) { return d3.select(this).datum().value.id === d.id ? 1 : 0 })  
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', function() { return this === elem ? 1 : 0 } )

        let selected = e => e.id === d.value.id && e.year === d.value.year && (e.node.key === d.source.key || e.node.key === d.target.key)
        this.chart.group.selectAll('.item-circle')
            .attr('opacity', e => selected(e) ? 1 : .2 )
            .attr('stroke-width', e => selected(e) ? 2 : 1 )

        this.chart.profiles.downplay()
        this.chart.fstlinks.downplay()

    }

    mouseout() {
        if (!this.chart.getTimeSelection()) return
        
        this.reverse()
        
        this.chart.nodes.reverse()

        this.chart.profiles.reverseDownplay()
        this.chart.fstlinks.reverse()
    }


    async getLinks() {

        // keep one link per node
        let links = this.chart.data.getLinks().filter(d => this.chart.areItemsVisible(d.source.key) && this.chart.areItemsVisible(d.target.key) && this.chart.isSelected(+d.year))
        
        links = links.filter( (d,i) => links.findIndex(e => ((e.source.key === d.source.key && e.target.key === d.target.key) || (e.source.key === d.target.key && e.target.key === d.source.key)) && e.item === d.item) === i)

        //links = links.filter(d => this.chart.isFreezeActive() ? this.chart.isFrozen(d.item) : true)

        // remove crossing links
        let nodes = this.chart.data.getNodesKeys()
       
        let temp = {}
        links.forEach( d => {
            let s = nodes.indexOf(d.source.key)
            let t = nodes.indexOf(d.target.key)

            temp[`${s}-${t}-${d.item}`] = d
        })

        let vertices = Object.keys(temp)
        let items = links.map(d => d.item)
        let indices = Object.keys(nodes)

        for (let i of items) {
            for (let x of indices) {
                for (let y of indices) {
                    for (let z of indices) {
                        if (vertices.includes(`${x}-${z}-${i}`) && vertices.includes(`${x}-${y}-${i}`) && vertices.includes(`${y}-${z}-${i}`))
                            delete temp[`${x}-${z}-${i}`]
                    }
                }
            }
        }

        return Object.values(temp);

    }
    /**
     * Function to compute the second level links of the network based on the nodes in focus
     * @returns an array containing the links
     */
    async getData() {
        
        let links = await this.getLinks()

        let linkedItems = links.map(d => d.item)
        let selection = this.chart.data.getItems().filter(e => linkedItems.includes(e.id) && this.chart.isSelected(e.year))
        let data = []

        links.forEach(d => {
            let nodesData = selection.filter(e =>  [d.source.key, d.target.key].includes(e.node.key) && e.id === d.item )
            
            for (let j = 0; j < nodesData.length - 1; j++) {

                let sourceIndex = nodesData.findIndex(e => e.node.key === d.source.key)
                let sData = nodesData[sourceIndex]
                let source = this.chart.app === 'crobora' ? {x: sData.x - (this.chart.xAxis.scale(sData.year) * .1) + sData.r, y: sData.y + sData.r} : {x: sData.x, y: sData.y}
                let sourceRadius = sData.r

                let targetIndex = nodesData.findIndex(e => e.node.key === d.target.key)
                let tData = nodesData[targetIndex]
                let target = this.chart.app === 'crobora' ? {x: tData.x - (this.chart.xAxis.scale(tData.year) * .1) + tData.r, y: tData.y} : {x: tData.x, y: tData.y}
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

                data.push({ value: nodesData[j],
                    source: d.source, 
                    target: d.target, 
                    types: types,
                    values: values
                })
                
                
            }
        })

        return data
    }
}