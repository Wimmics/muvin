// group that holds the second-level links (i.e. links between specific items)
import * as d3 from 'd3';

class NodeLinksGroup{
    constructor(chart) {
        this.chart = chart

        this.group = d3.select(this.chart.shadowRoot.querySelector('#nodeLinks-group')) 
    }

    set() {

        // this.linkInfo = d => `${this.chart.getItemLabel()}: ${d.item.title}\n\n${this.chart.getColorLabel()}: ${d.type}`  
        
        let colorScale = this.chart.getColorScale()

        this.linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)

        this.pathAttrs = {
            "stroke": d => colorScale(d.type),
            'stroke-width': 5,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
        }

        this.strokeAttrs = {
            "stroke": d => d3.rgb(colorScale(d.type)).darker(),
            'stroke-width': 7,
            'fill': 'none',
            'd': d => this.linkGenerator(d),
            'opacity': 1
        }
    }

    // draw the second level links (e.g. links between items (e.g. publications) that share a common node)
    async draw() {
        const _this = this;

        let data = await this.getData()
        console.log("data = ", data)
        let link = this.group.selectAll('.node-link')
            .data(data)
            .join(
                enter => enter.append('g')
                    .classed('node-link', true),                   
                update => update, 
                exit => exit.remove()
            )
            .call(g => g.attr('opacity', d => this.chart.isFreezeActive() ? (this.chart.isFrozen(d.value.id) ? 1 : 0) : 1  ))

        // Generate curved paths for each link
        // This function generates a smooth curve between the source and target nodes
        // It takes into account the number of siblings (links between the same source and target)
        // to create a horizontal offset for each sibling link, making them visually distinct
        function generateCurvedPath(d, i, siblings) {
            const { source, target } = d;
            
            const normalize = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
            const pairKey = normalize(source.key, target.key);
            
            const allSiblings = siblings.filter(sib =>
                normalize(sib.source.key, sib.target.key) === pairKey
            );
            
            const total = allSiblings.length;
            
            const x1 = source.x;
            const y1 = source.y;
            const x2 = target.x;
            const y2 = target.y;

            const dx = x2 - x1;
            const dy = y2 - y1;
            
            if (total <= 1) {
                // One link only — generate a default smooth curve with vertical bend
                const curveStrength = 0.5; // 0.3–0.6 is usually nice
                const cx1 = x1;
                const cy1 = y1 + dy * curveStrength;
                const cx2 = x2;
                const cy2 = y2 - dy * curveStrength;

                return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
            }
            
            const index = allSiblings.indexOf(d);
            const center = (total - 1) / 2;
            const offsetIndex = index - center;
            
            const horizontalOffset = offsetIndex * 80; // customize as needed
            
            const controlX1 = x1 + horizontalOffset;
            const controlX2 = x2 + horizontalOffset;
            
            return `M${x1},${y1} C${controlX1},${y1} ${controlX2},${y2} ${x2},${y2}`;
        }
              
        
        link.selectAll('path.path-stroke')
            .data(d => d.values.flat())
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-stroke single-link'),
                update => update,
                exit => exit.remove()
            )
            .attrs(this.strokeAttrs)
            .attr('d', function(d, i) {
                // Flatten siblings from same group
                const group = d3.select(this.parentNode).datum();
                const siblings = group.values.flat();
                return generateCurvedPath(d, i, siblings);
            })
            // .on("mouseenter", d => this.chart.tooltip.setLinkContent(d, 'link'))
            // .on("mouseleave", () => this.chart.tooltip.hide('link'))

        link.selectAll('path.path-link')
            .data(d => d.values.flat())
            .join(
                enter => enter.append('path')
                    .attr('class', 'path-link single-link')
                    .attrs(this.pathAttrs)
                    .attr('d', function(d, i) {
                        // Flatten siblings from same group
                        const group = d3.select(this.parentNode).datum();
                        const siblings = group.values.flat();
                        return generateCurvedPath(d, i, siblings);
                    })
                    .call(path => path.append('title').text(this.linkInfo)),
                update => update
                    .call(path => path.attrs(this.pathAttrs)
                        .attr('d', function(d, i) {
                            const group = d3.select(this.parentNode).datum();
                            const siblings = group.values.flat();
                            return generateCurvedPath(d, i, siblings);
                        }))
                    .call(path => path.select('title').text(this.linkInfo)),
                exit => exit.remove()
            )
            .on('mouseenter', function(d) { _this.mouseover(d, this) })
            .on('mouseleave', () => this.mouseout());
            
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

    /**
     * Highlights the links connected to a given node or item.
     * 
     * This function is typically called when hovering over a node or an item in the chart.
     * If the input is an item, it checks for matching `id` and `type` to determine the links to highlight.
     * If the input is a node, it checks whether the link includes the node.
     * 
     * @param {Object} d - The data object representing the node or item to highlight.
     */
    highlightLinks(d) {

        function isHighlighted(e) {
            return d.id ? e.item.id === d.id && d.type.includes(e.type) : e.nodes.includes(d)
        }

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => isHighlighted(e) ? 1 : 0.1)  
    }

    mouseover(d, elem) {        
        if (!this.chart.getTimeSelection()) return

        this.group.selectAll('.single-link')
            .transition()
            .duration(200)
            .attr('opacity', e => e.source.key === d.source.key && 
                e.target.key === d.target.key && e.type === d.type && e.item.id === d.item.id ? 1 : .1 )
        
        let selected = e => e.id === d.item.id && e.year === d.item.year && ([d.source.key, d.target.key].includes(e.node.key))
        this.chart.group.selectAll('.item-circle')
            .attr('opacity', e => selected(e) ? 1 : .1 )
            .attr('stroke-width', e => selected(e) ? 2 : 1 )

        this.chart.profiles.downplay()
        this.chart.fstlinks.downplay()

        this.chart.tooltip.setLinkContent(d, 'link')

    }

    mouseout() {
        if (!this.chart.getTimeSelection()) return
        
        this.reverse()
        
        this.chart.nodes.reverse()

        this.chart.profiles.reverseDownplay()
        this.chart.fstlinks.reverse()

        this.chart.tooltip.hide('link')
    }


    async getLinks() {

        // keep one link per node
        let links = [ ...this.chart.data.getLinks()] // make a local copy of the data to avoid propagating the modifications below
        
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