import Tooltip from './tooltip.js'
import ImageTooltip from './imageTooltip.js'

class TooltipFactory {

    static getTooltip(app, chart) {
        switch (app) {
            case 'crobora':
                return new ImageTooltip(chart) // tuned to display images
            default:
                return new Tooltip(chart) // default tooltip, generated from metadata
        }
    }
}

export default TooltipFactory