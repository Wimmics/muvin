import { Transform } from './transform.js'
import { CroboraTransform } from './croboraTransform.js'

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

export { TransformFactory }
