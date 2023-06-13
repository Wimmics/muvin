class Tooltip {
    constructor() {
        this.chart = document.querySelector('#muvin')
    }

    set() {
    
    }

    hideAll() {
        d3.selectAll(this.chart.shadowRoot.querySelectorAll('.tooltip'))
            .style('display', 'none')
    }

    hide(id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`))
            .style('display', 'none')
    }

    setContent(htmlContent, id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`)).html(htmlContent)
    }

    show(event, id, width = 250) {
        let tooltip = this.chart.shadowRoot.querySelector(`#${id}-tooltip`)
        tooltip.style.display = 'block';
        
        let x = event.pageX + 10,
            y = event.pageY + 10,
            tHeight = tooltip.clientHeight,
            tWidth = tooltip.clientWidth;

        if ( (x + tWidth) > window.innerWidth) x -= (tWidth + 30)
        if ( (y + tHeight) > window.innerHeight) y -= (tHeight + 30)

        d3.select(tooltip)
            .styles({
                left: x + 'px',
                top: y +'px',
                'pointer-events': 'none',
                'max-width': width + 'px'
            })
    }
}