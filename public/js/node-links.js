// group that holds the second-level links (i.e. links between specific items)

class NodeLinksGroup{
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodeLinks-group')) 
    }

    set() {

        this.linkInfo = d => `${d.source.name} ${d.symmetric ? '↔' : '→' } ${d.target.name}\n\nItem: ${d.item.title}\n\nContribution Type: ${d.type}`  
        
        this.linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)

        this.pathAttrs = {
            "stroke": d => this.chart.getTypeColor(d.type),
            'stroke-width': 5,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
        }

        this.strokeAttrs = {
            "stroke": d => d3.rgb(this.chart.getTypeColor(d.type)).darker(),
            'stroke-width': 7,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
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
                    .classed('node-link', true),                   
                update => update, 
                exit => exit.remove()
            )
            .call(g => g.attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1  ))

        // Set a constant offset value
        const offset = 10; // Adjust this value based on the desired distance between paths
        const transform = (d, i, nodes) => {
            const totalPaths = nodes.length;
            const centralOffset = (totalPaths - 1) / 2;
            return `translate(${(i - centralOffset) * offset}, 0)`;
        }

        link.selectAll('path.path-stroke')
            .data(d => d.values.flat()) // Add an offset index to each path
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-stroke single-link'),
                update => update,
                exit => exit.remove()
            )
            .attrs(this.strokeAttrs)
            .attr('transform', transform)
            

        link.selectAll('path.path-link')
            .data(d => d.values.flat()) // Add an offset index to each path
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-link single-link')
                    .attrs(this.pathAttrs)
                    .attr('transform', transform)
                    .call(path => path.append('title').text(this.linkInfo)),
                update => update.call(path => path.attrs(this.pathAttrs)
                        .attr('transform', transform))
                    .call(path => path.select('title').text(this.linkInfo)),
                exit => exit.remove()
            )
            .on('mouseenter', function(d) { _this.mouseover(d, this) })
            .on('mouseleave', () => this.mouseout())
            
    }
    
    hide() {
        this.group.selectAll('.node-link').attr('opacity', 0)
    }

    reverse() {
        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1 )

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', 1)
    }

    highlightLinks(d) {
        this.group.selectAll('.node-link')
            .transition()
            .duration(200)
            .attr('opacity', function(e) { return d3.select(this).datum().key === d.id ? 1 : 0 })  
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => e.source.key === d.source.key && 
                e.target.key === d.target.key && e.type === d.type && e.item.id === d.item.id ? 1 : .2 )

        console.log('hovered = ', d)
        
        let selected = e => e.id === d.item.id && e.year === d.item.year && ([d.source.key, d.target.key].includes(e.node.key))
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
        let links = JSON.parse(JSON.stringify(this.chart.data.getLinks())) // make a local copy of the data to avoid propagating the modifications below
        
        links = links.filter(d => this.chart.isSelected(d.year))

        // remove crossing links
        let nodes = this.chart.data.getNodesKeys()
       
        let temp = {}
        links.forEach( d => {
            let s = nodes.indexOf(d.source.key)
            let t = nodes.indexOf(d.target.key)

            let key = `${s}-${t}-${d.item}-${d.type}`
            let alternativeKey = `${t}-${s}-${d.item}-${d.type}`
            if (!temp[key] && !temp[alternativeKey]){
                temp[key] = d
            } 
        })

        let vertices = Object.keys(temp); // keys of links (source-target-item)
        let items = Object.values(temp).map(d => d.item) // keys of items
        let types =  Object.values(temp).map(d => d.type)

        let indices = Object.keys(nodes); // keys of nodes
        for (let i of items) {
            for (let t of types) {
                for (let x of indices) {
                    for (let y of indices) {
                        for (let z of indices) {
                            // Check for the transitivity condition: x → y, y → z, and x → z all exist
                            if (
                                vertices.includes(`${x}-${z}-${i}-${t}`) && // shortcut link
                                vertices.includes(`${x}-${y}-${i}-${t}`) && // first part of transitivity
                                vertices.includes(`${y}-${z}-${i}-${t}`)    // second part of transitivity
                            ) {
                                // Delete only the direct link that "skips" the intermediate node y
                                delete temp[`${x}-${z}-${i}-${t}`];
                            }
                        }
                    }
                }
            }
        }

        return Object.values(temp)

    }

    async filterSymmetricRelationships(data) {
        
    
        data.forEach(item => {
            // Store unique relationships by creating a unique key for each combination
            const uniqueRelationships = new Map();

            const itemKey = item.key
            const values = item.values.flat()
    
            values.forEach(relationship => {
                const { source, target, symmetric } = relationship;
                
                // If the relationship is symmetric, create a sorted key to identify duplicates
                const key = symmetric 
                    ? [source.key, target.key].sort().join('-') 
                    : `${source.key}-${target.key}`;
    
                // Add only if this key doesn't already exist in the map
                if (!uniqueRelationships.has(key)) {
                    uniqueRelationships.set(key, { ...relationship, key: itemKey });
                }
            })

            item.values = Array.from(uniqueRelationships.values())
        });
    
        // Convert the map values to an array to get the final filtered dataset
        return data
    }
    
    

    /**
     * Function to compute the second level links of the network based on the nodes in focus
     * @returns an array containing the links
     */
    async getData() {
        
        let links = await this.getLinks()
        console.log('links before = ', links)

        let linkedItems = links.map(d => d.item)
        let selection = await this.chart.data.getItems()
        selection = selection.filter(e => linkedItems.includes(e.id) && this.chart.isSelected(e.year))

        let nestedLinks = d3.nest()
            .key(d => d.item)
            .entries(links)

        console.log('nested before = ', JSON.parse(JSON.stringify(nestedLinks)))

        nestedLinks.forEach(d => {
            let nodesData = selection.filter(e => e.id === d.key )
            if (nodesData.length <= 1) return

            
            d.values = d.values.map( e => {
               
                let sData = nodesData.find(x => x.node.key === e.source.key)
                let source = this.chart.app === 'crobora' ? {x: sData.x + sData.r, y: sData.y} : 
                    {x: sData.x, y: sData.y}

               
                let tData = nodesData.find(x => x.node.key === e.target.key)
                let target = this.chart.app === 'crobora' ? {x: tData.x + tData.r, y: tData.y + tData.r} : 
                    {x: tData.x, y: tData.y}     
                    
                if (source.y > target.y) {
                    source.y -= sData.r
                    target.y += tData.r
                } else {
                    source.y += sData.r
                    target.y -= tData.r
                }
                
                let values = []
                // e.type.forEach( (t,i) => {

                    values.push( { source: { ...e.source.contribution.includes(e.type) ? e.source : e.target,  ...source}, 
                        target: {...e.source.contribution.includes(e.type) ? e.target : e.source, ...target}, 
                        type: e.type, 
                        item: { ...nodesData[0] },
                        symmetric:  e.source.contribution.includes(e.type) && e.target.contribution.includes(e.type)
                    } )
                // })

                return values
            })
        })


        console.log(nestedLinks)

        return nestedLinks
        // Example usage with your data
        // return await this.filterSymmetricRelationships(nestedLinks);
    }
}