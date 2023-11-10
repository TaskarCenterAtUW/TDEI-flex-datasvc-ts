import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional } from "class-validator";
import { DynamicQueryObject, SqlORder } from "../database/dynamic-query-object";
import { InputException } from "../exceptions/http/http-exceptions";
import { Utility } from "../utility/utility";

export class FlexQueryParams {
    @IsOptional()
    flex_schema_version: string | undefined;
    @IsOptional()
    date_time: string | undefined;
    @IsOptional()
    tdei_project_group_id: string | undefined;
    @IsOptional()
    tdei_record_id: string | undefined;
    @IsOptional()
    tdei_service_id: string | undefined;
    @IsOptional()
    confidence_level = 0;
    @IsOptional()
    @IsArray()
    @ArrayMinSize(4)
    @ArrayMaxSize(4)
    bbox: Array<number> = [];
    @IsOptional()
    page_no = 1;
    @IsOptional()
    page_size = 10;

    constructor(init?: Partial<FlexQueryParams>) {
        Object.assign(this, init);
    }

    /**
     * Builds the parameterized sql query.
     * @returns DynamicQueryObject
     */
    getQueryObject() {
        const queryObject: DynamicQueryObject = new DynamicQueryObject();
        queryObject.buildSelect("flex_versions", ["ST_AsGeoJSON(polygon) as polygon2, *"]);
        queryObject.buildPagination(this.page_no, this.page_size);
        queryObject.buildOrder("uploaded_date", SqlORder.DESC);
        //Add conditions
        if (this.flex_schema_version)
            queryObject.condition(` flex_schema_version = $${queryObject.paramCouter++} `, this.flex_schema_version);
        if (this.tdei_project_group_id)
            queryObject.condition(` tdei_project_group_id = $${queryObject.paramCouter++} `, this.tdei_project_group_id);
        if (this.tdei_record_id)
            queryObject.condition(` tdei_record_id = $${queryObject.paramCouter++} `, this.tdei_record_id);
        if (this.tdei_service_id)
            queryObject.condition(` tdei_service_id = $${queryObject.paramCouter++} `, this.tdei_service_id);
        if (this.date_time && Utility.dateIsValid(this.date_time))
            queryObject.condition(` valid_to > $${queryObject.paramCouter++} `, (new Date(this.date_time).toISOString()));
        else if (this.date_time && !Utility.dateIsValid(this.date_time))
            throw new InputException("Invalid date provided." + this.date_time);
        if (this.bbox && this.bbox.length > 0 && this.bbox.length == 4) {
            queryObject.condition(`polygon && ST_MakeEnvelope($${queryObject.paramCouter++},$${queryObject.paramCouter++},$${queryObject.paramCouter++},$${queryObject.paramCouter++}, 4326)`,
                this.bbox);
        }
        else if (this.bbox.length > 0 && this.bbox.length != 4) {
            throw new InputException("Bounding box constraints not satisfied.");
        }

        return queryObject;
    }
}