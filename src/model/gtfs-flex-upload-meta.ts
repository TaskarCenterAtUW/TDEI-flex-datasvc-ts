import { IsDate, IsISO8601, IsIn, IsNotEmpty, isNotEmpty } from "class-validator";
import { AbstractDomainEntity, Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { FeatureCollection } from "geojson";
import { Readable } from "stream";

/**
 * Separated out class to get and validate the input metadata
 * for GTFS Flex upload. This class is similar to `GtfsFlexDTO`
 * but has some variations in terms of properties validity
 * Validation checks are as per 
 * https://docs.google.com/spreadsheets/d/1JpG_9Z1nvTgZc2e0rzEl3RQ2fOWW9R0_ecfZm7fn940/edit#gid=0
 * 
 * 
  {
    "tdei_org_id": "e1956869-02d9-4e14-8391-6024406ced41",
    "tdei_service_id": "a73d0a95-f9e2-4067-b4c9-a1f82419e82e",
    "collected_by": "testuser",
    "collection_date": "2023-03-02T04:22:42.493Z",
    "collection_method": "manual",
    "valid_from": "2023-03-02T04:22:42.493Z",
    "valid_to": "2023-03-02T04:22:42.493Z",
    "data_source": "TDEITools",
    "polygon": {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -122.32615394375401,
              47.61267259760652
            ],
            [
              -122.32615394375401,
              47.60504395643625
            ],
            [
              -122.3155850364906,
              47.60504395643625
            ],
            [
              -122.3155850364906,
              47.61267259760652
            ],
            [
              -122.32615394375401,
              47.61267259760652
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
  ]
},
    "flex_schema_version": "v2.0"
  }
 */
export class GtfsFlexUploadMeta extends AbstractDomainEntity{

    @Prop()
    @IsNotEmpty()
    collected_by!:string;

    @Prop()
    @IsISO8601()
    @IsNotEmpty()
    collection_date!: Date;

    @Prop()
    @IsNotEmpty()
    tdei_service_id!:string;

    @Prop()
    @IsNotEmpty()
    tdei_org_id!:string;

    @Prop()
    @IsNotEmpty()
    @IsIn(['manual','transform','generated','others'])
    collection_method!:string;

    @Prop()
    @IsNotEmpty()
    @IsIn(['3rdParty', 'TDEITools', 'InHouse'])
    data_source!:string;

    @Prop()
    @IsValidPolygon()
    polygon!:FeatureCollection ;

    @Prop()
    flex_schema_version!:string;

    @Prop()
    @IsISO8601()
    @IsNotEmpty()
    valid_to!:Date;

    @Prop()
    @IsISO8601()
    @IsNotEmpty()
    valid_from!:Date;

    /**
     * Returns the readable stream of the information
     * @returns Readable stream for upload
     */
    getStream(): NodeJS.ReadableStream {
        const stringContent = JSON.stringify(this);
        const buffer =  Buffer.from(stringContent)
        return Readable.from(buffer);
    }

}