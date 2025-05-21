import * as d3 from 'd3';
import { capitalizeFirstLetter } from '../utils.js'
import questionIcon from '../../images/question.svg'

class Legend {
    constructor(chart) {
        this.chart = chart
        
        this.itemRadius = 7
        this.fontSize = 12
        this.left = 10

        this.div = d3.select(this.chart.shadowRoot.querySelector('div.legend'))

        this.selected = []
    }

    init() {

        // color legend for links (i.e. collaboration type)
        this.linkLegend = this.div.append('div')
            .classed('link-legend', true)
            .style('width', "100%")

        this.svg = this.linkLegend.append('svg')
            .attr('id', 'link-legend')
            
        this.svg.append('text')
            .text(this.chart.app === 'crobora' ? 'Broadcaster' : 'Contribution Type') //TODO: feed from stylesheet
            .attr('font-size', this.fontSize)
            .attr('transform', `translate(0, 25)`)
        
        this.svg.append('svg:image')
            .attr('xlink:href', `../assets/${questionIcon}`)
            .attr('width', 15)
            .attr('height', 15)
            .attr('x', 110)
            .attr('y', 12)
            .style('cursor', 'pointer')
            .append('title')
            .text(`Click on the circles to show/hide items in each ${this.chart.app === 'crobora' ? 'channel' : 'category'}`)

        this.hide()
        
    }

    update() {

        let chartData = this.chart.getData()
        this.colors = chartData.colors
        this.data = chartData.linkTypes

        this.drawLinkLegend()

        this.show()

    }

    drawLinkLegend() {

        this.svg.attr('width', "100%").attr('height', 70)

        // Get the total width of the SVG container
        let totalWidth = window.innerWidth

        // Calculate the total width needed by summing up the width of all text labels
        let textWidths = this.data.map(d => {
            let text = capitalizeFirstLetter(d);
            return text.length * this.fontSize * .4;  // Estimate text width based on font size
        });

        // Total required width (including circles and some padding)
        let totalRequiredWidth = textWidths.reduce((acc, width) => acc + width, 0) + this.data.length * (this.itemRadius * 2 + 10);

        // Calculate the spacing between each item to evenly distribute them
        let availableSpace = totalWidth - totalRequiredWidth;
        let spacing = availableSpace / (this.data.length - 1);

        // Center offset for text positioning relative to circles
        let circleTextPadding = this.itemRadius + 10;
            
        // Ensure that `xPosition` values do not overlap
        let currentX = this.left;

        this.group = this.svg.selectAll('g')
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .call(g => g.append('circle')
                        .attr('cx', 0)
                        .attr('cy', this.left)         
                        .attr('r', this.itemRadius)
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e) )
                        .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d)).darker())
                        .style('cursor', 'pointer') 
                        
                        .call(circle => circle.append('title')
                            .text(e => `Click to display/hide items in this ${this.chart.app === 'crobora' ? 'channel' : 'category'}`)) )
                    
                    .call(g => g.append('text')
                        .attr('font-size', this.fontSize)
                        .attr('y', (_,i) => this.itemRadius * 2)
                        .attr('x', (d,i) => circleTextPadding)
                        .text(d => capitalizeFirstLetter(d))),
                update => update
                    .call(g => g.select('circle')
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e)) 
                        .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d)).darker()) )

                    .call(g => g.select('text')
                        .attr('x', circleTextPadding)
                        .text(d => capitalizeFirstLetter(d))),
                exit => exit.remove()
            )
            // Calculate the x position by summing the widths and adding spacing
            .attr('transform', (d, i) => {
                let xPosition = currentX;
                currentX += textWidths[i] + this.itemRadius * 2 + spacing; // Move currentX to the next position
                return `translate(${xPosition}, 35)`;
            })

        this.group.selectAll('circle')
            .on('click', d => this.handleClick(d))
            
            
    }

    handleClick(d) {
        
        if (this.selected.includes(d)) {
            let index = this.selected.indexOf(d)
            this.selected.splice(index, 1)
        }
        else this.selected.push(d)

        this.chart.data.updateFilters('linkTypes', this.selected)
        this.chart.update()

    }

    show() {
        this.div.style('display', 'flex')
    }

    hide() {
        this.div.style('display', 'none')
    }
}

export default Legend