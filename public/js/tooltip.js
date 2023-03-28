class Tooltip {
    constructor() {
        this.chart = document.querySelector('#muvin')
    }

    set() {
       
    }

    hide(id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`))
            .style('display', 'none')
    }

    setContent(htmlContent, id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`)).html(htmlContent)
    }

    show(event, id) {
        let tooltip = this.chart.shadowRoot.querySelector(`#${id}-tooltip`)
        // console.log(tooltip)
        let x = event.pageX + 10,
            y = event.pageY + 10,
            tHeight = tooltip.clientHeight,
            tWidth = tooltip.clientWidth;

        // console.log(x, tWidth, window.innerWidth, x + tWidth)

        if ( (x + tWidth) > window.innerWidth) x = window.innerWidth - tWidth
        if ( (y + tHeight) > window.innerHeight) y = window.innerHeight - tHeight

        d3.select(tooltip)
            .styles({
                left: x + 'px',
                top: y +'px',
                display: 'block',
                'pointer-events': 'none'
            })
    }
}