import { IsDate, IsISO8601, IsIn, IsNotEmpty, isNotEmpty } from "class-validator";
import { AbstractDomainEntity, Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { FeatureCollection } from "geojson";

/**
 * Separated out class to get and validate the input metadata
 * for GTFS Flex upload. This class is similar to `GtfsFlexDTO`
 * but has some variations in terms of properties validity
 * Validation checks are as per 
 * https://docs.google.com/spreadsheets/d/1JpG_9Z1nvTgZc2e0rzEl3RQ2fOWW9R0_ecfZm7fn940/edit#gid=0
 * 
 * tdei_org_id: '5e339544-3b12-40a5-8acd-78c66d1fa981',
  tdei_service_id: '333',
  collected_by: 'testuser',
  collection_date: '2023-03-02T04:22:42.493Z',
  collection_method: 'manual',
  valid_from: '2023-03-02T04:22:42.493Z',
  valid_to: '2023-03-02T04:22:42.493Z',
  data_source: 'TDEITools',
  polygon: { coordinates: [ [Array] ] },
  flex_schema_version: 'v2.0'
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

}