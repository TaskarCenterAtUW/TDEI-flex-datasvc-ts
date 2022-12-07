export interface Polygon {
    type: string
    features: Feature[]
}

export interface Feature {
    type: string
    properties: GtfsFlexProperties
    geometry: Geometry
}

export interface GtfsFlexProperties { }

export interface Geometry {
    type: string
    coordinates: number[][][]
}