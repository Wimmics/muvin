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
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`))
            .styles({
                left: event.pageX + 10 + 'px',
                top: event.pageY + 10 +'px',
                display: 'block',
                'pointer-events': 'none'
            })
    }
}