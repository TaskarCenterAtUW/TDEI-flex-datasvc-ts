import { IsNotEmpty, IsOptional } from 'class-validator';
import { FeatureCollection } from 'geojson';
import { Prop } from 'nodets-ms-core/lib/models';
import { QueryConfig } from 'pg';
import { BaseDto } from '../../model/base-dto';
import { IsValidPolygon } from '../../validators/polygon-validator';

export class FlexVersions extends BaseDto {
    @Prop()
    id!: number;
    @Prop()
    @IsNotEmpty()
    tdei_record_id!: string;
    confidence_level = 0;
    @Prop()
    @IsNotEmpty()
    tdei_project_group_id!: string;
    @Prop()
    @IsNotEmpty()
    tdei_service_id!: string;
    @Prop()
    @IsNotEmpty()
    file_upload_path!: string;
    @Prop()
    @IsNotEmpty()
    uploaded_by!: string;
    @Prop()
    @IsNotEmpty()
    collected_by!: string;
    @Prop()
    @IsNotEmpty()
    collection_date!: Date;
    @Prop()
    @IsNotEmpty()
    collection_method!: string;
    @Prop()
    @IsNotEmpty()
    valid_from!: Date;
    @Prop()
    @IsNotEmpty()
    valid_to!: Date;
    @Prop()
    @IsNotEmpty()
    data_source!: string;
    @Prop()
    @IsNotEmpty()
    flex_schema_version!: string;
    @IsOptional()
    @IsValidPolygon()
    @Prop()
    polygon!: FeatureCollection;

    constructor(init?: Partial<FlexVersions>) {
        super();
        Object.assign(this, init);
    }

    /**
     * Builds the insert QueryConfig object
     * @returns QueryConfig object
     */
    getInsertQuery(): QueryConfig {
        const polygonExists = this.polygon ? true : false;
        const queryObject = {
            text: `INSERT INTO public.flex_versions(tdei_record_id, 
                confidence_level, 
                tdei_project_group_id, 
                tdei_service_id, 
                file_upload_path, 
                uploaded_by,
                collected_by, 
                collection_date, 
                collection_method, valid_from, valid_to, data_source,
                flex_schema_version ${polygonExists ? ', polygon ' : ''})
                VALUES ($1,0,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12 ${polygonExists ? ', ST_GeomFromGeoJSON($13) ' : ''})`.replace(/\n/g, ""),
            values: [this.tdei_record_id, this.tdei_project_group_id, this.tdei_service_id, this.file_upload_path, this.uploaded_by
                , this.collected_by, this.collection_date, this.collection_method, this.valid_from, this.valid_to, this.data_source, this.flex_schema_version],
        }
        if (polygonExists) {
            queryObject.values.push(JSON.stringify(this.polygon.features[0].geometry));
        }
        return queryObject;
    }

    /**
     * Query where the valid_from and valid_to dates are overlapping
     * Eg.
     * If Record has valid_from: 23-Mar-2023 and valid_to:23-Apr-2023
     *  {valid_from:01-Apr-2023, valid_to: 26-Apr-2023} : Invalid
     *  {valid_from:20-Mar-2023, valid_to: 26-Apr-2023} : Invalid
     *  {valid_from:20-Mar-2023, valid_to: 10-Apr-2023} : Invalid
     *  {valid_from:24-Mar-2023, valid_to: 10-Apr-2023} : Invalid
     *  {valid_from:24-Mar-2023, valid_to: 10-Apr-2023} : Invalid
     *  {valid_from:10-Mar-2023, valid_to: 22-Mar-2023} : Valid
     *  Same ord_id and service_id with the following condition
     *  input_valid_from >= record_valid_from && input_valid_to 
     */
    getOverlapQuery(): QueryConfig {
        const fromDate = new Date(this.valid_from);
        const toDate = new Date(this.valid_to);

        const queryObject = {
            text: `SELECT tdei_record_id from public.flex_versions where 
            tdei_project_group_id = $1 
            AND tdei_service_id = $2 
            AND (valid_from,valid_to) OVERLAPS ($3 , $4)`,
            values: [this.tdei_project_group_id, this.tdei_service_id, fromDate, toDate]
        };
        return queryObject;
    }
}