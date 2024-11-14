const { Transform } = require('./transform')

const { WasabiTransform } = require('./wasabiTransform')
const { CroboraTransform } = require('./croboraTransform')
const { HALTransform } = require('./halTransform')

class TransformFactory extends Transform {
    constructor() {
        super()
    }

    static getTransform(app, data) {
        switch (app) {
            // case 'hal':
            //     return new HALTransform(app, data)
            // case 'wasabi':
            //     return new WasabiTransform(app, data)
            case 'crobora':
                return new CroboraTransform(app, data)
            default:
                return new Transform(app, data)
        }
    }
}

module.exports = {
    TransformFactory: TransformFactory
}