const { Transform } = require('./transform')

const { WasabiTransform } = require('./wasabiTransform')
const { CroboraTransform } = require('./croboraTransform')
const { HALTransform } = require('./halTransform')

class TransformFactory extends Transform {
    constructor() {
        super()
    }

    static getTransform(app) {
        switch (app) {
            case 'hal':
                return new HALTransform()
            case 'wasabi':
                return new WasabiTransform()
            case 'crobora':
                return new CroboraTransform()
            default:
                return new Transform()
        }
    }
}

module.exports = {
    TransformFactory: TransformFactory
}