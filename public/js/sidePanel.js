class SidePanel {
    constructor(data) {
        this.data = data;

        this.chart = document.querySelector('#muvin')

        this.div = d3.select(this.chart.shadowRoot.querySelector('.menu-buttons'))

        this.width = 250 
        this.height = 250

        this.CLOSE = '/muvin/images/close.svg'

        // Defined in the children class
        this.div;
        this.title;

    }

    init() { }

    open() {
        this.div.style('width', this.width + 'px')
            .style('left', '0px')
    }

    close() {
        this.div.style('width', '0px')
    }

    setTitle() {
        let topbar = this.div.append('div')
            .classed('panel-topbar', true)
        
        topbar.append('div')
            .style('width', this.width * .8 + 'px')
            .style('padding', '5px')
            .append('text')
            .text(this.title)
            .style('font-weight', 'bold')
            
        topbar.append('div')
            .style('width', this.width * .2 + 'px')
            .append('svg')
            .attr('transform', 'translate(30, 10)')
                .append("svg:image")
                .attr('xlink:href', this.CLOSE)
                .attr('width', '15')
                .attr('height', '15')
                .style('cursor', 'pointer')
                .on('click', () => this.close())
    }
}