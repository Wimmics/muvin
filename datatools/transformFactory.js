const { Transform } = require('./transform')

const { CroboraTransform } = require('./croboraTransform')

class TransformFactory extends Transform {
    constructor() {
        super()
    }

    static getTransform(app, data) {
        switch (app) {
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