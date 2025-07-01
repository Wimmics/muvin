// group that holds the second-level links (i.e. links between specific items)
import * as d3 from 'd3';

class NodeLinksGroup{
    constructor(chart) {
        this.chart = chart

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
        
            // Step 1: Normalize the source-target pairs (make undirected paths equivalent)
            let normalizePair = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
            let currentPair = normalizePair(d.source.key, d.target.key);

            // Step 2: Normalize all pairs from nodes
            let pairs = nodes.map(node => { 
                let datum = d3.select(node).datum();
                return normalizePair(datum.source.key, datum.target.key);
            });

            // Step 3: Count how many times the current pair appears
            let totalPaths = pairs.filter(pair => pair === currentPair).length;

            // Step 4: Calculate centralOffset for centering
            const centralOffset = (totalPaths - 1) / 2;
        
            // Step 5: Return the transformation (no need to transform if there is only one unique link)
            return totalPaths === 1 ? `translate(0, 0)` : `translate(${(i - centralOffset) * offset}, 0)`;
        };

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
        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => (d.id ? e.item.id === d.id : e.nodes.includes(d)) ? 1 : 0.2)  
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => e.source.key === d.source.key && 
                e.target.key === d.target.key && e.type === d.type && e.item.id === d.item.id ? 1 : .2 )
        
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
    

    /**
     * Function to compute the second level links of the network based on the nodes in focus
     * @returns an array containing the links
     */
    async getData() {
        
        let links = await this.getLinks()
        
        let linkedItems = links.map(d => d.item)
        let selection = await this.chart.data.getItems()
        selection = selection.filter(e => linkedItems.includes(e.id) && this.chart.isSelected(e.year))

        let nestedLinks = d3.nest()
            .key(d => d.item)
            .entries(links)

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

                let item = { ...nodesData[0] }
                values.push( { source: { ...e.source.contribution.includes(e.type) ? e.source : e.target,  ...source}, 
                    target: {...e.source.contribution.includes(e.type) ? e.target : e.source, ...target}, 
                    type: e.type, 
                    item: item,
                    symmetric:  e.source.contribution.includes(e.type) && e.target.contribution.includes(e.type),
                    nodes: item.contributors.map(x => x.key)
                } )

                return values
            })
        })


        return nestedLinks
    }
}

export default NodeLinksGroup