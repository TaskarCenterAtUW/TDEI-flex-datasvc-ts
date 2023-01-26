import { IsNotEmpty } from 'class-validator';
import { Polygon } from "../../model/polygon-model";

export class FlexVersions {
    id!: number;
    @IsNotEmpty()
    tdei_record_id: string = "";
    confidence_level: number = 0;
    @IsNotEmpty()
    tdei_org_id: string = "";
    @IsNotEmpty()
    tdei_service_id: string = "";
    @IsNotEmpty()
    file_upload_path: string = "";
    @IsNotEmpty()
    uploaded_by: string = "";
    @IsNotEmpty()
    collected_by: string = "";
    @IsNotEmpty()
    collection_date: Date = new Date();
    @IsNotEmpty()
    collection_method: string = "";
    @IsNotEmpty()
    valid_from: Date = new Date();
    @IsNotEmpty()
    valid_to: Date = new Date();
    @IsNotEmpty()
    data_source: string = "";
    @IsNotEmpty()
    flex_schema_version: string = "";
}