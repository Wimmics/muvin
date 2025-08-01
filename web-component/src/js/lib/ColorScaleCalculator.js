// Import de D3 depuis CDN
import * as d3 from "d3"

/**
* Calculateur de palettes de couleurs pour l'encoding visuel des graphes de connaissances.
* Parse les ranges de type string (ex: "Blues", "Blues[5]") vers les schémas D3 appropriés.
* Compatible avec les types ordinal et quantitative.
*/
export class ColorScaleCalculator {
    constructor() {
        
        // Logging configuration - set to false to show only warnings and errors
        this.enableDebugLogs = false;
        
        this.defaultSequential = d3.interpolateBlues;
    }
    
    _logWarn(message, ...args) {
        console.warn(`${message}`, ...args);
    }
    
    /**
    * Valide si une couleur est reconnue (hex, noms CSS standard)
    * @param {string} color - Couleur à valider
    * @returns {boolean} True si la couleur est valide
    */
    isValidColor(color) {
        if (typeof color !== 'string') return false;
        
        // Valider couleurs hex (#rgb, #rrggbb)
        const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
        if (hexPattern.test(color)) return true;
        
        // Valider couleurs CSS nommées courantes
        const cssColors = [
            'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
            'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
            'maroon', 'olive', 'teal', 'silver', 'aqua', 'fuchsia', 'indigo',
            'violet', 'gold', 'coral', 'salmon', 'khaki', 'crimson', 'chocolate'
        ];
        
        return cssColors.includes(color.toLowerCase());
    }
    
    /**
    * Convertit un composant RGB en hexadécimal
    * @param {number} c - Composant RGB (0-255)
    * @returns {string} Hexadécimal à 2 caractères
    */
    componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    
    /**
    * Convertit RGB en couleur hexadécimale
    * @param {number} r - Rouge (0-255)
    * @param {number} g - Vert (0-255)
    * @param {number} b - Bleu (0-255)
    * @returns {string} Couleur hexadécimale
    */
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }
    
    /**
    * Convertit une couleur hexadécimale en RGB
    * @param {string} hex - Couleur hexadécimale
    * @returns {string} Format rgb(r, g, b)
    */
    hexToRgb(hex) {
        // Supprimer le "#" si présent
        hex = hex.replace(/^#/, '');
        
        // Convertir de la forme courte (3 caractères) à la forme complète (6 caractères)
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        
        // Convertir en valeurs RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
    * Parse un nom de schéma D3 avec support des indices (ex: "Blues[5]")
    * @param {string} input - Nom du schéma (ex: "Blues", "Blues[5]", "Category10")
    * @param {string} scaleType - Type d'échelle ('ordinal' ou 'quantitative')
    * @returns {object|null} {type: "interpolate"|"scheme", value: function|array, raw: string}
    */
    parseD3ColorScheme(input, scaleType = 'ordinal') {
        const regex = /^([a-zA-Z0-9]+)(?:\[(\d+)\])?$/;
        const match = input.match(regex);
        
        if (!match) return null;
        
        const rawName = match[1];
        const index = match[2] ? parseInt(match[2], 10) : null;
        
        // Essayer plusieurs variations de normalisation
        const variations = [
            // Première lettre majuscule + reste minuscule (ex: viridis → Viridis)
            rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase(),
            // Tout en majuscule (ex: viridis → VIRIDIS)  
            rawName.toUpperCase(),
            // Exactement comme fourni (ex: Viridis → Viridis)
            rawName,
            // Tout en minuscule (ex: VIRIDIS → viridis)
            rawName.toLowerCase()
        ];
        
        for (const normalizedName of variations) {
            if (scaleType === 'quantitative' || scaleType === 'sequential') {
                // Pour quantitative : utiliser interpolate
                const fullInterpolate = `interpolate${normalizedName}`;
                
                if (fullInterpolate in d3 && typeof d3[fullInterpolate] === "function") {
                    return {
                        type: "interpolate",
                        value: d3[fullInterpolate],
                        raw: rawName,
                    };
                }
            } else {
                // Pour ordinal : utiliser scheme
                const fullScheme = `scheme${normalizedName}`;
                
                if (fullScheme in d3) {
                    const scheme = d3[fullScheme];
                    
                    const colorCount = index || scheme.length - 1
                    let colors = [...scheme.slice(0, colorCount + 1)]

                    return {
                        type: 'scheme',
                        value: colors,
                        raw: rawName
                    }
                    
                }
            }
        }
        
        return null;
    }
    
    /**
    * Obtient le meilleur fallback selon le type d'échelle et la taille du domaine
    * @param {string} scaleType - Type d'échelle ('ordinal' ou 'quantitative')
    * @param {number} domainSize - Taille du domaine
    * @returns {*} Meilleur fallback (scheme array ou interpolator function)
    */
    getBestFallback(scaleType, domainSize) {
        if (scaleType === 'quantitative' || scaleType === 'sequential') {
            // Pour quantitative : utiliser des interpolateurs perceptuels
            return this.defaultSequential;
        } else {
            // Pour ordinal : utiliser des palettes catégorielles optimisées
            if (domainSize <= 10) {
                return d3.schemeCategory10; // Palette optimale jusqu'à 10 catégories
            } else if (domainSize <= 12) {
                return d3.schemeSet3; // Palette plus claire pour plus de catégories
            } else {
                // Pour beaucoup de catégories, générer depuis un interpolateur
                return d3.quantize(d3.interpolateSpectral, domainSize);
            }
        }
    }
    
    /**
    * Main method to create a color scale
    * @param {object} options - Options {domain, range, dataKeys, scaleType, fallbackInterpolator, label}
    * @returns {object} {scale, domain, range}
    */
    createColorScale({ 
        domain, 
        range, 
        type = 'ordinal',
        fallbackInterpolator = null, // Will be automatically calculated if null
    }) {

        const isDomainValid = Array.isArray(domain) && domain.length > 0;
        
        // Domain validation
        if (!isDomainValid) {
            throw new Error(`Domain should be a non-empty array.`)
        }
        
        // Get the best fallback if not specified
        const smartFallback = fallbackInterpolator || this.getBestFallback(type, domain.length);
        
        // Process the range with the new parsing logic
        let finalRange = range;

        const checkRangeLength = () => {
            // The following warnings should only exist when the user provides the color range, it is being thrown when calculating the default color range
            if (finalRange.length < domain.length) {
                this._logWarn(`Color range shorter than domain. Colors will repeat.`);
            } 
            // else if (finalRange.length > domain.length) {
            //     this._logWarn(`Color range longer than domain. Extra colors ignored.`);
            // }
        }
        
        // No range specified → use the smart fallback
        if (range === null || range === undefined) { 
            if (typeof smartFallback === 'function') {
                finalRange = d3.quantize(smartFallback, domain.length);
            } else if (Array.isArray(smartFallback)) {
                finalRange = smartFallback;
            }
        } 
        
        // Range is a string -> check for palette name
        else if (typeof range === 'string') {
            const parsed = this.parseD3ColorScheme(range, type);
            if (parsed?.type === "interpolate") {
                finalRange = d3.quantize(parsed.value, domain.length);
            } else if (parsed?.type === "scheme") {
                finalRange = parsed.value;
                checkRangeLength()
            } else {
                // Palette not found - use fallback and warning
                this._logWarn(`Palette "${range}" not found for type "${type}". Using default palette instead. See https://d3js.org/d3-scale-chromatic for valid palette names.`);
                if (typeof smartFallback === 'function') {
                    finalRange = d3.quantize(smartFallback, domain.length);
                } else if (Array.isArray(smartFallback)) {
                    finalRange = smartFallback;
                }
            }
        } 
        
        // Range is an array with a single value -> check whether the value is a palette name
        else if (Array.isArray(range) && range.length === 1 && typeof range[0] === 'string') {
            
            // Check if it's a D3 palette name in an array (error)
            const potentialSchemeName = range[0];
            const parsed = this.parseD3ColorScheme(potentialSchemeName, type);
            
            if (parsed !== null) {
                // It's a valid palette name in an array - throw an explicit error
                const errorMessage = `Unsupported range format: ["${potentialSchemeName}"]. ` +
                `To use a pre-existing palette, use the string directly: "${potentialSchemeName}". ` +
                `Arrays are reserved for explicit hexadecimal colors like ["#1f77b4", "#ff7f0e"].`;
                
                throw new Error(errorMessage);
            }
            // If it's not a recognized palette name, continue normal processing
        }
        
        // Range is an array -> validate provided colors
        else if (Array.isArray(finalRange) && finalRange.length > 0) {
            const validColors = [];
            const invalidColors = [];
            
            finalRange.forEach(color => {
                if (this.isValidColor(color)) {
                    validColors.push(color);
                } else {
                    invalidColors.push(color);
                }
            });
            
            if (invalidColors.length > 0) {
                this._logWarn(`Invalid colors detected and removed: [${invalidColors.join(', ')}]. Valid colors kept: [${validColors.join(', ')}]`);
                if (validColors.length > 0) {
                    finalRange = validColors;
                } else {
                    this._logWarn(`No valid colors found in range. Using default palette.`);
                    finalRange = null; // Will be handled by final validation
                }
            }
            
            checkRangeLength()
        }
        
        // Final range validation
        if (!Array.isArray(finalRange) || finalRange.length === 0) {
            this._logWarn(`Invalid color range. Using smart fallback.`);
            if (typeof smartFallback === 'function') {
                // If it's an interpolator, quantize
                finalRange = d3.quantize(smartFallback, domain.length);
            } else if (Array.isArray(smartFallback)) {
                // If it's already a scheme array, use it directly
                finalRange = smartFallback;
            } else {
                // Last resort fallback
                finalRange = d3.quantize(this.defaultSequential, domain.length);
            }
        }
        
        // Final color mapping
        const finalColors = domain.map((_, i) => finalRange[i % finalRange.length]);
        
        // Create the scale based on the type
        let scale;
        if (type === 'quantitative' || type === 'sequential') {
            // For quantitative, prefer scaleSequential if we have an interpolator
            if (typeof range === 'string') {
                const parsed = this.parseD3ColorScheme(range, type);
                if (parsed?.type === "interpolate") {
                    // Create a numeric domain for scaleSequential
                    scale = d3.scaleSequential(parsed.value)
                        .domain([0, domain.length - 1]);

                    // Wrapper to return the color by domain index
                    const originalScale = scale;
                    scale = (value) => {
                        const index = domain.indexOf(value);
                        return index !== -1 ? originalScale(index) : originalScale(0);
                    };
                    scale.domain = () => domain;
                    scale.range = () => finalColors;
                } else {
                    // Fallback to ordinal if no interpolator
                    scale = d3.scaleOrdinal().domain(domain).range(finalColors);
                }
            } else {
                scale = d3.scaleOrdinal().domain(domain).range(finalColors);
            }
        } else {
            // For ordinal (default)
            scale = d3.scaleOrdinal().domain(domain).range(finalColors);
        }
        
        return scale
    }
    
    /**
    * Obtient la méthode D3 appropriée selon le type d'échelle
    * @param {string} type - Type d'échelle ('ordinal', 'quantitative', 'sequential')
    * @returns {function} Constructeur d'échelle D3
    */
    getD3Method(type) {
        switch (type) {
            case 'quantitative':
            case 'sequential':
                return d3.scaleSequential;
            case 'ordinal':
            default:
                return d3.scaleOrdinal;
        }
    }
    
    /**
    * Obtient une palette de couleurs simple par nom
    * @param {string} name - Nom du schéma (ex: "Blues", "Blues[5]", "Category10")
    * @param {number} size - Taille souhaitée de la palette
    * @param {string} scaleType - Type d'échelle ('ordinal' ou 'quantitative')
    * @returns {Array} Palette de couleurs
    */
    getColorPalette(name, size = 8, scaleType = 'ordinal') {
        const parsed = this.parseD3ColorScheme(name, scaleType);
        
        if (parsed?.type === "interpolate") {
            return d3.quantize(parsed.value, size);
        } else if (parsed?.type === "scheme") {
            const scheme = parsed.value;
            if (Array.isArray(scheme)) {
                return scheme.slice(0, size);
            }
        }
        
        // Fallback intelligent basé sur le type et la taille
        const smartFallback = this.getBestFallback(scaleType, size);
        if (typeof smartFallback === 'function') {
            return d3.quantize(smartFallback, size);
        } else if (Array.isArray(smartFallback)) {
            return smartFallback.slice(0, size);
        }
        
        // Dernier recours
        return d3.quantize(this.defaultSequential, size);
    }
}

// Fonction utilitaire pour parser les schémas D3 (compatible avec le code existant)
export function parseD3ColorScheme(schemeName, scaleType = 'ordinal') {
    const calculator = new ColorScaleCalculator();
    return calculator.parseD3ColorScheme(schemeName, scaleType);
}

// Fonction utilitaire pour créer une échelle de couleurs (compatible avec le code existant)
export function createColorScale({ domain, range, dataKeys, fallbackInterpolator = null, label = "Color" }) {
    const calculator = new ColorScaleCalculator();
    return calculator.createColorScale({ domain, range, dataKeys, scaleType: 'ordinal', fallbackInterpolator, label });
}
